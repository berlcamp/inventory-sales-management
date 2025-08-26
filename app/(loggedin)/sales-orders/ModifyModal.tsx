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
    const max =
      editData.order_items[index].original_quantity ??
      editData.order_items[index].quantity

    setPartialQuantities((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: Math.min(value, max) // clamp against original_quantity
            }
          : item
      )
    )
  }

  const handleUpdateQuantity = async () => {
    if (saving) return
    setSaving(true)

    // 🔹 Build updated list with new quantities
    const updatedOrderItems = editData.order_items.map((item, index) => ({
      ...item,
      quantity: partialQuantities[index].quantity
    }))

    // 🔹 Check if any change was made
    const hasChanges = updatedOrderItems.some(
      (item, i) => item.quantity !== editData.order_items[i].quantity
    )

    if (!hasChanges) {
      toast('No changes made.')
      setSaving(false)
      onClose()
      return
    }

    let totalAmount = 0

    for (const item of updatedOrderItems) {
      // ⛔ Skip if no change in this item
      const originalItem = editData.order_items.find((o) => o.id === item.id)
      if (!originalItem || originalItem.quantity === item.quantity) {
        continue
      }

      // 🔹 1. Fetch existing row
      const { data: existing, error: fetchError } = await supabase
        .from('sales_order_items')
        .select('logs, original_quantity, quantity, unit_price, discount')
        .eq('id', item.id)
        .single()

      if (fetchError) {
        console.error(fetchError)
        continue
      }

      // 🔹 2. Compute total for this item
      const discount = existing?.discount ?? 0
      const newTotal = item.quantity * (existing?.unit_price ?? 0) - discount

      totalAmount += newTotal

      // 🔹 3. Create log entry
      const newLog = {
        modified_at: new Date().toISOString(),
        modified_by: user?.id,
        previous_quantity: existing?.quantity,
        new_quantity: item.quantity
      }

      // 🔹 4. Update row
      const { error: updateError } = await supabase
        .from('sales_order_items')
        .update({
          quantity: item.quantity,
          original_quantity: existing?.original_quantity ?? existing?.quantity,
          logs: [...(existing?.logs ?? []), newLog],
          total: newTotal
        })
        .eq('id', item.id)

      if (updateError) {
        console.error(updateError)
      }
    }

    // 🔹 5. Recalculate parent sales_order total_amount
    const { error: orderUpdateError } = await supabase
      .from('sales_orders')
      .update({ total_amount: totalAmount, modified: true })
      .eq('id', editData.id)

    if (orderUpdateError) {
      console.error(orderUpdateError)
    }

    // 🔹 6. Update Redux state
    dispatch(
      updateList({
        ...editData,
        modified: true,
        order_items: updatedOrderItems.map((item) => ({
          ...item,
          total: item.quantity * item.unit_price - (item.discount ?? 0)
        })),
        total_amount: totalAmount
      })
    )

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
                        max={item.original_quantity || item.quantity}
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
