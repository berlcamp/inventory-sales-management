// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { PurchaseOrder } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: PurchaseOrder
}

export const ViewProductsModal = ({
  isOpen,
  onClose,
  editData
}: ModalProps) => {
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
              Product Items
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
                  <th className="app__th">Quantity</th>
                  <th className="app__th">Price</th>
                  <th className="app__th">Total</th>
                </tr>
              </thead>
              <tbody>
                {editData.order_items.map((item, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td">{item.product?.name}</td>
                    <td className="app__td">{item.quantity}</td>
                    <td className="app__td">{item.cost}</td>
                    <td className="app__td">
                      {parseFloat(
                        ((item.quantity ?? 0) * (item.cost ?? 0)).toFixed(2)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
