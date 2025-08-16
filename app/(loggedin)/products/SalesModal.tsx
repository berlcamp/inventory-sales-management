// components/AddItemTypeModal.tsx
'use client'

import Php from '@/components/Php'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { SalesOrderItem } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

// Always update this on other pages
type ItemType = SalesOrderItem

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
}

export const SalesModal = ({ isOpen, onClose, productId }: ModalProps) => {
  //
  const [sales, setSales] = useState<SalesOrderItem[] | null>([])

  useEffect(() => {
    const initForm = async () => {
      const { data } = await supabase
        .from('sales_order_items')
        .select('*,sales_order:sales_order_id(*,customer:customer_id(*))')
        .eq('product_id', productId)
        .order('date', { ascending: false })
      setSales(data)
    }

    if (isOpen) {
      initForm()
    }
  }, [productId, isOpen])

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
              Sales
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
                    <th className="app__th">Customer</th>
                    <th className="app__th">SO No.</th>
                    <th className="app__th">Unit Price</th>
                    <th className="app__th">Quantity</th>
                    <th className="app__th">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales?.map((item: ItemType) => (
                    <tr key={item.id} className="app__tr">
                      {/* Date */}
                      <td className="app__td">
                        {item.sales_order?.date &&
                        !isNaN(new Date(item.sales_order?.date).getTime())
                          ? format(
                              new Date(item.sales_order?.date),
                              'MMMM dd, yyyy'
                            )
                          : 'Invalid date'}
                      </td>

                      {/* Customer */}
                      <td className="app__td">
                        <span className="font-bold">
                          {item.sales_order?.customer?.name}
                        </span>
                      </td>

                      {/* SO Number */}
                      <td className="app__td">{item.sales_order?.so_number}</td>

                      {/* Unit Price */}
                      <td className="app__td">
                        <Php />{' '}
                        {item.unit_price?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Quantity */}
                      <td className="app__td">{item.quantity}</td>

                      {/* Total */}
                      <td className="app__td">
                        <Php />{' '}
                        {item.total?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  ))}

                  {sales?.length === 0 && (
                    <tr className="app__tr">
                      <td colSpan={6} className="app__td text-center">
                        No sales records found
                      </td>
                    </tr>
                  )}

                  {/* Totals Row */}
                  {sales && sales.length > 0 && (
                    <tr className="app__tr font-bold bg-gray-50">
                      <td colSpan={3} className="app__td text-right">
                        Totals:
                      </td>
                      <td className="app__td">
                        <Php />{' '}
                        {sales
                          .reduce(
                            (sum, item) => sum + (item.unit_price ?? 0),
                            0
                          )
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                      </td>
                      <td className="app__td">
                        {sales.reduce(
                          (sum, item) => sum + (item.quantity ?? 0),
                          0
                        )}
                      </td>
                      <td className="app__td">
                        <Php />{' '}
                        {sales
                          .reduce((sum, item) => sum + (item.total ?? 0), 0)
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
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
