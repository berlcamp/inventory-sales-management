// components/AddItemTypeModal.tsx
'use client'

import { supabase } from '@/lib/supabase/client'
import { RootState } from '@/store'
import { useAppSelector } from '@/store/hook'
import { SalesOrder, SalesOrderItem } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import Php from './Php'
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
  const [runningTotal, setRunningTotal] = useState(0)

  const user = useAppSelector((state: RootState) => state.user.user)

  useEffect(() => {
    const initForm = async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*,order_items:sales_order_items(*,product:product_id(*))')
        .eq('company_id', user?.company_id)
        .eq('customer_id', customerId)
        .order('id', { ascending: false })

      if (error) {
        console.error('Error fetching sales orders:', error)
        return
      }

      setLogs(data)

      if (data && data.length > 0) {
        const total = data.reduce((sum, order) => {
          const orderTotal = (order.order_items || []).reduce(
            (itemSum: number, item: SalesOrderItem) => {
              return itemSum + (item.total || 0)
            },
            0
          )
          return sum + orderTotal
        }, 0)
        setRunningTotal(total)
      } else {
        setRunningTotal(0)
      }
    }

    if (isOpen) {
      initForm()
    }
  }, [customerId, isOpen, user?.company_id])

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
        <DialogPanel transition className="app__modal_dialog_panel_lg">
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
            <div className="mt-4 text-right font-semibold">
              Total:&nbsp;
              <Php />{' '}
              {runningTotal?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="overflow-x-none pb-20">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">Date</th>
                    <th className="app__th">SO Number</th>
                    <th className="app__th">Products</th>
                    <th className="app__th text-right">Quantity</th>
                    <th className="app__th text-right">Price</th>
                    <th className="app__th text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((item: ItemType) => (
                    <tr key={item.id} className="app__tr">
                      {/* Date */}
                      <td className="app__td">
                        {item.date && !isNaN(new Date(item.date).getTime())
                          ? format(new Date(item.date), 'MMMM dd, yyyy')
                          : 'Invalid date'}
                      </td>

                      {/* SO Number */}
                      <td className="app__td">
                        <span className="font-bold">{item.so_number}</span>
                      </td>

                      {/* Products */}
                      <td className="app__td">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id} className="flex items-center">
                              <span>
                                {oi.product?.name?.length > 70
                                  ? oi.product.name.slice(0, 70) + '…'
                                  : oi.product?.name}
                              </span>
                            </div>
                          ))}
                      </td>

                      {/* Quantity */}
                      <td className="app__td text-right">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id}>{oi.quantity}</div>
                          ))}
                      </td>

                      {/* Price */}
                      <td className="app__td text-right">
                        {item.order_items.length > 0 &&
                          item.order_items.map((oi) => (
                            <div key={oi.id}>
                              <Php />{' '}
                              {oi.unit_price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </div>
                          ))}
                      </td>

                      {/* Total Amount */}
                      <td className="app__td text-right">
                        <span className="font-bold">
                          <Php />{' '}
                          {item.total_amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  {logs && logs.length > 0 && (
                    <tr className="app__tr font-bold bg-gray-50">
                      <td colSpan={3} className="app__td text-right">
                        Totals:
                      </td>
                      <td className="app__td text-right">
                        {logs
                          .reduce(
                            (sum, item) =>
                              sum +
                              item.order_items.reduce(
                                (s, oi) => s + oi.quantity,
                                0
                              ),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          })}
                      </td>
                      <td className="app__td text-right">
                        <Php />{' '}
                        {logs
                          .reduce(
                            (sum, item) =>
                              sum +
                              item.order_items.reduce(
                                (s, oi) => s + oi.unit_price,
                                0
                              ),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                      </td>
                      <td className="app__td text-right">
                        <Php />{' '}
                        {logs
                          .reduce((sum, item) => sum + item.total_amount, 0)
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                      </td>
                    </tr>
                  )}
                  {logs?.length === 0 && (
                    <tr className="app__tr">
                      <td colSpan={6} className="app__td text-center">
                        No records found
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
