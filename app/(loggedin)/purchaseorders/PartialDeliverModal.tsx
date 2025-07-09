// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { useAppSelector } from '@/store/hook'
import { updateList } from '@/store/listSlice'
import { PurchaseOrder, RootState } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: PurchaseOrder
}

export const PartialDeliverModal = ({
  isOpen,
  onClose,
  editData
}: ModalProps) => {
  //
  const [saving, setSaving] = useState(false)

  const [partialQuantities, setPartialQuantities] = useState(() =>
    editData.order_items.map((item) => ({
      quantity: item.quantity, // default full quantity
      to_deliver: item.to_deliver // default full quantity
    }))
  )
  const dispatch = useDispatch()

  const user = useAppSelector((state: RootState) => state.user.user)

  const handleQuantityChange = (index: number, value: number) => {
    setPartialQuantities((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Math.min(value, editData.order_items[i].quantity),
              to_deliver: Math.min(value, editData.order_items[i].to_deliver)
            }
          : item
      )
    )
  }

  const handlePartialDelivery = async () => {
    if (saving) return // ⛔️ Prevent re-entry
    setSaving(true)

    const deliveredItems = editData.order_items
      .map((item, index) => ({
        product_id: item.product_id,
        cost: item.cost,
        price: item.price,
        quantity: partialQuantities[index].quantity,
        purchase_order_id: editData.id
      }))
      .filter((item) => item.quantity > 0)

    const stockEntries = deliveredItems.map((item) => ({
      product_id: item.product_id,
      cost: item.cost,
      selling_price: item.price,
      quantity: item.quantity,
      remaining_quantity: item.quantity,
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_order_id: item.purchase_order_id
    }))

    const { error: stockError } = await supabase
      .from('product_stocks')
      .insert(stockEntries)

    if (stockError) {
      console.error('Stock insert failed', stockError)
      return
    }

    const updatedOrderItems = editData.order_items.map((item, index) => {
      const deliveredQty = partialQuantities[index].quantity
      const newDelivered = (item.delivered ?? 0) + deliveredQty
      const newToDeliver = (item.to_deliver ?? item.quantity) - deliveredQty
      return {
        ...item,
        delivered: newDelivered,
        to_deliver: newToDeliver < 0 ? 0 : newToDeliver
      }
    })

    for (const item of updatedOrderItems) {
      await supabase
        .from('purchase_order_items')
        .update({
          delivered: item.delivered,
          to_deliver: item.to_deliver
        })
        .eq('id', item.id)
    }

    // Check final status
    const allDelivered = updatedOrderItems.every(
      (item) => item.to_deliver === 0
    )
    const status = allDelivered ? 'delivered' : 'partially delivered'

    await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', editData.id)

    dispatch(
      updateList({
        ...editData,
        status,
        order_items: updatedOrderItems
      })
    )

    await supabase.from('product_change_logs').insert({
      po_id: editData.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `received partial delivery`
    })

    toast.success('Updated successfully!')
    setSaving(false)
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {}}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      {/* Centered panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel transition className="app__modal_dialog_panel_sm">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            {/* Saving overlay inside modal */}
            {saving && (
              <div className="absolute inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-white text-lg font-semibold animate-pulse">
                  Processing...
                </div>
              </div>
            )}
            <DialogTitle as="h3" className="text-base font-medium flex-1">
              Partially Delivered Items
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <table className="app__table mb-10">
              <thead className="app__thead">
                <tr>
                  <th className="app__th">Product</th>
                  <th className="app__th">Quantity Received</th>
                </tr>
              </thead>
              <tbody>
                {editData.order_items.map((item, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td font-medium">
                      {item.product?.name}
                    </td>
                    <td className="app__td">
                      <Input
                        type="number"
                        min={0}
                        max={item.to_deliver}
                        value={partialQuantities[index].to_deliver}
                        onChange={(e) =>
                          handleQuantityChange(index, Number(e.target.value))
                        }
                        className="w-20 bg-white border rounded px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex justify-end">
              <Button onClick={handlePartialDelivery} disabled={saving}>
                {saving ? 'Processing...' : 'Deliver Selected Quantities'}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
