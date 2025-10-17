// components/AddItemTypeModal.tsx
'use client'

import Php from '@/components/Php'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addList } from '@/store/stocksSlice'
import { RootState, SalesOrder, SalesOrderPayment } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { format } from 'date-fns'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

const title = 'Payment'

type ItemType = SalesOrderPayment
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: SalesOrder
}

export const PaymentsModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const dispatch = useAppDispatch()

  const list = useSelector((state: RootState) => state.stocksList.value)

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('sales_order_payments')
        .select('*')
        .eq('sales_order_id', editData?.id)

      if (error) {
        console.error(error)
      } else {
        // Update the list of suppliers in Redux store
        dispatch(addList(data))
      }
    }

    fetchData()
  }, [dispatch, editData, isOpen])

  const totalReceived = (list as ItemType[]).reduce(
    (total, item) => total + item.amount,
    0
  )
  const remainingAmount = editData.total_amount - totalReceived

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
              Received {title}
            </DialogTitle>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <div className="flex space-x-4 border-t pt-2">
              <div>
                <span className="text-xs">Sales Order Total:</span>{' '}
                <span className="font-bold">
                  <Php />{' '}
                  {editData.total_amount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              <div>
                <span className="text-xs">Total Payments Received:</span>{' '}
                <span className="font-bold">
                  <Php />{' '}
                  {totalReceived?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              <div>
                <span className="text-xs">Remaining Amount:</span> <Php />{' '}
                <span className="font-bold">
                  {remainingAmount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
            <table className="app__table mb-10">
              <thead className="app__thead">
                <tr>
                  <th className="app__th"></th>
                  <th className="app__th">Date</th>
                  <th className="app__th">Amount Received</th>
                  <th className="app__th">Type</th>
                  {/* <th className="app__th"></th> */}
                </tr>
              </thead>
              <tbody>
                {list.map((item: ItemType) => (
                  <tr key={item.id} className="app__tr">
                    <td className="w-6 pl-4 app__td"></td>
                    <td className="app__td">
                      {item.date && !isNaN(new Date(item.date).getTime())
                        ? format(new Date(item.date), 'MMMM dd, yyyy')
                        : 'Invalid date'}
                    </td>
                    <td className="app__td">{item.amount}</td>
                    <td className="app__td">
                      {item.type}{' '}
                      {item.due_date && `(Due Date: ${item.due_date})`}{' '}
                      {item.bank && `(Bank: ${item.bank})`}{' '}
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr className="app__tr">
                    <td className="app__td" colSpan={5}>
                      No payments received
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
