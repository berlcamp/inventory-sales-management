'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

type ConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  message
}: ConfirmationModalProps) => {
  if (!isOpen) return null

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
        <DialogPanel
          transition
          className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg backdrop-blur-2xl"
        >
          <DialogTitle as="h3" className="text-base/7 font-medium">
            Confirmation
          </DialogTitle>
          <p className="mt-2">{message}</p>
          <div className="mt-4 flex justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={onConfirm} variant="green">
              Confirm
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
