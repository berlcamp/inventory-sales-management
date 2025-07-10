'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Customer } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useEffect, useState } from 'react'

type ConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
}

type RawSalesOrder = {
  id: number
  so_number: string | null
  total_amount: number
  delivery_fee: number | null
  customer: Customer | null
  payments: { amount: number | null }[] | null
}

type DisplayOrder = {
  id: number
  so_number: string | null
  customer_name: string
  balance: number
}

export const OutstandingPayments = ({
  isOpen,
  onClose
}: ConfirmationModalProps) => {
  const [processing, setProcessing] = useState(false)
  const [orders, setOrders] = useState<DisplayOrder[]>([])

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setProcessing(true)

      const { data, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          so_number,
          total_amount,
          delivery_fee,
          customer:customer_id(name),
          payments:sales_order_payments(amount)
        `
        )
        .eq('payment_status', 'unpaid')

      if (error) {
        console.error('Error fetching orders:', error.message)
        setProcessing(false)
        return
      }

      const filtered = (data as unknown as RawSalesOrder[])
        .map((order) => {
          const totalPaid =
            order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0

          const totalDue =
            Number(order.total_amount) + Number(order.delivery_fee ?? 0)
          const balance = totalDue - totalPaid

          return {
            id: order.id,
            so_number: order.so_number,
            customer_name: order.customer?.name ?? 'Unknown', // fixed here
            balance: parseFloat(balance.toFixed(2))
          }
        })
        .filter((order) => order.balance > 0)

      setOrders(filtered)
      setProcessing(false)
    }

    fetchData()
  }, [isOpen])

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
                      SO#: {order.so_number || 'N/A'} — {order.customer_name}
                    </div>
                    <div className="text-sm">
                      Payable Amount: ₱
                      {order.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* 💰 Total Payable Amount */}
              <div className="mt-6 text-right text-lg font-semibold">
                Total Payable: ₱
                {orders
                  .reduce((sum, order) => sum + order.balance, 0)
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
