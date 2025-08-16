'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { RootState } from '@/store'
import { useAppSelector } from '@/store/hook'
import { SalesOrder, SalesOrderPayment } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import Php from './Php'

type ConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
}

export const OutstandingPayments = ({
  isOpen,
  onClose
}: ConfirmationModalProps) => {
  //
  const user = useAppSelector((state: RootState) => state.user.user)

  const [processing, setProcessing] = useState(false)
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [history, setHistory] = useState<SalesOrderPayment[]>([])

  const [openHistoryOrderId, setOpenHistoryOrderId] = useState<number | null>(
    null
  )

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setProcessing(true)

      const { data, error } = await supabase
        .from('sales_orders')
        .select('*,customer:customer_id(name)')
        .eq('company_id', user?.company_id)
        .neq('payment_status', 'Deposited')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error.message)
        setProcessing(false)
        return
      } else {
        setOrders(data)
      }

      setProcessing(false)
    }

    fetchData()
  }, [isOpen, user?.company_id])

  const handleTogglePaymentHistory = async (id: number) => {
    if (openHistoryOrderId === id) {
      // If same order clicked again → close it
      setOpenHistoryOrderId(null)
      setHistory([])
      return
    }

    // Otherwise load and show this order's history
    const { data, error } = await supabase
      .from('sales_order_payments')
      .select()
      .eq('sales_order_id', id)
      .order('date', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setHistory(data)
      setOpenHistoryOrderId(id)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {}}
    >
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg backdrop-blur-2xl">
          <DialogTitle as="h3" className="text-lg font-semibold">
            Outstanding Sales Orders
          </DialogTitle>

          {processing ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-gray-500">No outstanding payments found.</p>
          ) : (
            <>
              <div className="mt-4 max-h-[400px] overflow-y-auto space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-md p-4 shadow-sm bg-gray-100"
                  >
                    <div className="font-medium">
                      SO#: {order.so_number || 'N/A'} — {order.customer?.name}
                    </div>
                    <div className="text-sm">
                      Payable Amount: ₱
                      {order.total_amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                    <div className="text-sm mt-4 text-blue-800">
                      <span
                        onClick={() => handleTogglePaymentHistory(order.id)}
                        className="cursor-pointer"
                      >
                        {openHistoryOrderId === order.id
                          ? 'Hide Payments History'
                          : 'View Payments History'}
                      </span>
                    </div>

                    {openHistoryOrderId === order.id && (
                      <div className="mt-2">
                        {history.length === 0 && (
                          <div className="w-full text-base border bg-white p-4 font-medium">
                            No payments received for this customer yet.
                          </div>
                        )}
                        {history.length > 0 && (
                          <table className="w-full text-sm border bg-white">
                            <thead>
                              <tr>
                                <th className="app__th">Date</th>
                                <th className="app__th">Amount Received</th>
                                <th className="app__th">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history?.map((item) => (
                                <tr key={item.id} className="app__tr">
                                  <td className="app__td">
                                    {item.date &&
                                    !isNaN(new Date(item.date).getTime())
                                      ? format(
                                          new Date(item.date),
                                          'MMMM dd, yyyy'
                                        )
                                      : 'Invalid date'}
                                  </td>
                                  <td className="app__td">
                                    <Php />{' '}
                                    {item.amount.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td className="app__td">
                                    {item.type}{' '}
                                    {item.due_date &&
                                      `(Due Date: ${item.due_date})`}{' '}
                                    {item.bank && `(Bank: ${item.bank})`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* 💰 Total Payable Amount */}
              <div className="mt-6 text-right text-lg font-semibold">
                Total Payable: ₱
                {orders
                  .reduce((sum, order) => sum + order.total_amount, 0)
                  .toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
