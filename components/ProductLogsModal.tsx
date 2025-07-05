// components/AddItemTypeModal.tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { ProductStockLog } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

// Always update this on other pages
type ItemType = ProductStockLog

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  stockId?: number
  productId?: number
  salesOrderId?: number
  POId?: number
}

export const ProductLogsModal = ({
  isOpen,
  onClose,
  stockId,
  productId,
  salesOrderId,
  POId
}: ModalProps) => {
  //
  const [logs, setLogs] = useState<ProductStockLog[] | null>([])

  useEffect(() => {
    const initForm = async () => {
      console.log('POId', POId)

      if (stockId) {
        const { data } = await supabase
          .from('product_change_logs')
          .select()
          .eq('product_stock_id', salesOrderId)
        setLogs(data)
      }
      if (productId) {
        const { data } = await supabase
          .from('product_change_logs')
          .select()
          .eq('product_id', productId)
        setLogs(data)
      }
      if (salesOrderId) {
        const { data } = await supabase
          .from('product_change_logs')
          .select()
          .eq('sales_order_id', salesOrderId)
        setLogs(data)
      }
      if (POId) {
        const { data } = await supabase
          .from('product_change_logs')
          .select()
          .eq('po_id', POId)
        setLogs(data)
      }
    }

    if (isOpen) {
      initForm()
    }
  }, [stockId, POId, salesOrderId, productId, isOpen])

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
              Logs
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="overflow-x-none pb-20">
              <table className="app__table">
                {/* <thead className="app__thead">
                  <tr>
                    <th className="app__th">Date</th>
                    <th className="app__th">User</th>
                    <th className="app__th">Log</th>
                  </tr>
                </thead> */}
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
                        <span className="font-bold">{item.user_name}</span>{' '}
                        {item.message}
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
