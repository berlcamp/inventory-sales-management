// components/AddItemTypeModal.tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { SalesOrder } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

// Always update this on other pages
type ItemType = SalesOrder

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  customerId: number
  name: string
}

export const CustomerOrdersModal = ({
  isOpen,
  onClose,
  customerId,
  name
}: ModalProps) => {
  //
  const [logs, setLogs] = useState<SalesOrder[] | null>([])

  useEffect(() => {
    const initForm = async () => {
      const { data } = await supabase
        .from('sales_orders')
        .select('*,order_items:sales_order_items(*,product:product_id(*))')
        .eq('customer_id', customerId)
      setLogs(data)
    }

    if (isOpen) {
      initForm()
    }
  }, [customerId, isOpen])

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
              Orders of {name}
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="overflow-x-none pb-20">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">Date</th>
                    <th className="app__th">SO Number</th>
                    <th className="app__th">Total Amount</th>
                    <th className="app__th">Products</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((item: ItemType) => (
                    <tr key={item.id} className="app__tr">
                      <td className="app__td">
                        {item.created_at &&
                        !isNaN(new Date(item.created_at).getTime())
                          ? format(new Date(item.created_at), 'MMMM dd, yyyy')
                          : 'Invalid date'}
                      </td>
                      <td className="app__td">
                        <span className="font-bold">{item.so_number}</span>
                      </td>
                      <td className="app__td">
                        <span className="font-bold">
                          {item.total_amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </td>
                      <td className="app__td">
                        <span>
                          {item.order_items.length > 0 &&
                            item.order_items.map((item) => (
                              <div key={item.id}>{item.product?.name}</div>
                            ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs?.length === 0 && (
                    <tr className="app__tr">
                      <td colSpan={3} className="app__td">
                        No change logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
