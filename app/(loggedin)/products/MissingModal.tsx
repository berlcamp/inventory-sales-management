'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { updateList } from '@/store/stocksSlice'
import { ProductStock, RootState } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  editData: ProductStock | null
}

export const MissingModal = ({ isOpen, onClose, editData }: Props) => {
  const dispatch = useAppDispatch()
  const [qty, setQty] = useState(0)
  const [loading, setLoading] = useState(false)

  const user = useAppSelector((state: RootState) => state.user.user)

  if (!isOpen || !editData) return null

  const handleSubmit = async () => {
    if (qty <= 0) return toast.error('Enter a valid quantity')

    if (qty > editData.remaining_quantity) {
      return toast.error('Quantity exceeds remaining stock')
    }

    setLoading(true)

    const updated = {
      quantity: editData.quantity - qty,
      remaining_quantity: editData.remaining_quantity - qty,
      missing: (editData.missing ?? 0) + qty
    }

    const { error } = await supabase
      .from('product_stocks')
      .update(updated)
      .eq('id', editData.id)

    if (error) {
      toast.error('Failed to update missing quantity')
      setLoading(false)
      return
    }

    // Update logs
    await supabase.from('product_change_logs').insert({
      product_id: editData?.product_id,
      product_stock_id: editData?.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `Added missing item(${qty})`
    })

    dispatch(
      updateList({
        ...editData,
        ...updated
      })
    )

    toast.success('Missing quantity added')
    setQty(0)
    setLoading(false)
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
            <DialogTitle as="h3" className="text-base font-medium flex-1">
              Add Missing Quantity
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="mb-4">
              <label htmlFor="missingQty" className="block mb-2 text-sm">
                Quantity
              </label>
              <Input
                id="missingQty"
                type="number"
                value={qty}
                min={1}
                max={editData.quantity}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-1/2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                Save
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
