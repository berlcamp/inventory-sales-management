// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { useAppSelector } from '@/store/hook'
import { updateList } from '@/store/listSlice'
import { RootState, SalesOrder } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: SalesOrder
}

export const ModifyModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [saving, setSaving] = useState(false)

  const [partialQuantities, setPartialQuantities] = useState(() =>
    editData.order_items.map((item) => ({
      quantity: item.quantity // default full quantity
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
              quantity: Math.min(value, editData.order_items[i].quantity)
            }
          : item
      )
    )
  }

  const handleUpdateQuantity = async () => {
    if (saving) return // ⛔️ Prevent re-entry
    setSaving(true)

    const updatedOrderItems = editData.order_items.map((item, index) => {
      return {
        ...item,
        quantity: partialQuantities[index].quantity
      }
    })

    for (const item of updatedOrderItems) {
      await supabase
        .from('purchase_order_items')
        .update({
          quanntity: item.quantity
        })
        .eq('id', item.id)
    }

    dispatch(
      updateList({
        ...editData,
        status,
        order_items: updatedOrderItems
      })
    )

    await supabase.from('product_change_logs').insert({
      sales_order_id: editData.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `Modified this sales order`
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
        <DialogPanel transition className="app__modal_dialog_panel">
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
              Actual Delivered Items
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
                  <th className="app__th">Actual Delivered Quantity</th>
                </tr>
              </thead>
              <tbody>
                {editData.order_items.map((item, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td font-medium">
                      {item.product_stock?.product?.name}
                    </td>
                    <td className="app__td">
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={partialQuantities[index].quantity}
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
              <Button onClick={handleUpdateQuantity} disabled={saving}>
                {saving ? 'Processing...' : 'Save modification'}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
