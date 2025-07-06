// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Category } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: Category
}

export const ViewProductsModal = ({
  isOpen,
  onClose,
  editData
}: ModalProps) => {
  // const runningTotal = editData.products.reduce((sum, item) => {
  //   return sum + (item.s* item.quantity || 0)
  // }, 0)

  console.log('editdata', editData)

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
                  <th className="app__th">Unit</th>
                  <th className="app__th">Current Quantity</th>
                </tr>
              </thead>
              <tbody>
                {editData.products?.map((item, index) => (
                  <tr key={index} className="app__tr">
                    <td className="app__td">{item.name}</td>
                    <td className="app__td">{item.unit}</td>
                    <td className="app__td">{item.current_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* <div className="mt-4 text-right font-semibold">
              Total Cost:&nbsp;
              {runningTotal?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div> */}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
