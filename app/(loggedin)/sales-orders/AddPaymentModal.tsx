// components/AddItemTypeModal.tsx
'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import Php from '@/components/Php'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { updateList } from '@/store/listSlice'
import {
  addItem,
  addList,
  deleteItem,
  updateList as updateStocksList
} from '@/store/stocksSlice'
import { RootState, SalesOrder, SalesOrderPayment } from '@/types'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CheckIcon, ChevronDown, TrashIcon } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { z } from 'zod'

const table = 'sales_order_payments'
const title = 'Payment'

type ItemType = SalesOrderPayment
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: SalesOrder
}

const FormSchema = z.object({
  date: z.string().min(1, 'Amount is required'),
  amount: z.coerce.number().min(1, 'Amount is required'),
  type: z.string().min(1, 'Payment Type is required'),
  bank: z.string().optional(),
  due_date: z.string().optional()
})
type FormType = z.infer<typeof FormSchema>

export const AddPaymentModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  const list = useSelector((state: RootState) => state.stocksList.value)
  const user = useSelector((state: RootState) => state.user.user)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: '',
      amount: 0,
      type: '',
      bank: '',
      due_date: ''
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        date: formdata.date,
        amount: formdata.amount,
        type: formdata.type,
        bank: formdata.bank,
        due_date: formdata.due_date,
        sales_order_id: editData.id
      }

      // Add new one
      const { data, error } = await supabase
        .from(table)
        .insert([newData])
        .select()

      if (error) {
        console.error('Error adding:', error)
      } else {
        // Update logs
        await supabase.from('product_change_logs').insert({
          sales_order_id: editData.id,
          user_id: user?.system_user_id,
          user_name: user?.name,
          message: `received payment (${formdata.type})`
        })

        // Insert new item to Redux
        dispatch(addItem({ ...newData, id: data[0].id }))

        // Update main list payment status
        dispatch(
          updateList({
            ...editData,
            id: editData.id,
            payment_status:
              totalReceived + formdata.amount >= editData.total_amount
                ? 'paid'
                : 'partial',
            payments: [...list, formdata] // include the new payment in the list
          })
        )

        form.reset({
          date: '',
          amount: 0,
          type: '',
          bank: '',
          due_date: ''
        })
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handlePaymentReceived = async (item: ItemType) => {
    const { error } = await supabase
      .from('sales_order_payments')
      .update({
        type: 'Cheque'
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error updating type:', error.message)
    } else {
      // Dispatch to Redux to update local state
      dispatch(
        updateStocksList({
          ...item,
          type: 'Cheque'
        })
      )

      const totalReceived = (list as ItemType[]).reduce(
        (total, item) => total + item.amount,
        0
      )
      const remainingAmount = editData.total_amount - totalReceived

      // Update main list payment status
      dispatch(
        updateList({
          ...editData,
          id: editData.id,
          payment_status:
            remainingAmount >= editData.total_amount ? 'paid' : 'partial'
        })
      )

      toast.success('Successfully saved!')
    }
  }

  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from('sales_order_payments')
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting supplier:', error.message)
      } else {
        // delete item to Redux
        dispatch(deleteItem(selectedItem))

        // Update main list payment status
        dispatch(
          updateList({
            ...editData,
            payment_status:
              totalReceived - selectedItem.amount <= 0 ? 'unpaid' : 'partial',
            id: editData.id
          })
        )

        toast.success('Successfully deleted!')
        setIsModalOpen(false)
      }
    }
  }

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
            {totalReceived < editData.total_amount && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__formlabel_standard">
                              Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="app__input_date"
                                type="date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__formlabel_standard">
                              Amount
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="app__input_standard"
                                type="number"
                                step="any"
                                min={1}
                                max={remainingAmount}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="app__formlabel_standard">
                              Payment Type
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value} // <- this ensures the selected value updates dynamically
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Payment Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="PDC">
                                  Cheque (PDC)
                                </SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Bank Deposit">
                                  Bank Deposit
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('type') === 'PDC' && (
                      <div>
                        <FormField
                          control={form.control}
                          name="due_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="app__formlabel_standard">
                                PDC Due Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="app__input_date"
                                  type="date"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    {form.watch('type') !== 'Cash' &&
                      form.watch('type') !== '' && (
                        <div>
                          <FormField
                            control={form.control}
                            name="bank"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="app__formlabel_standard">
                                  Bank Details
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="app__input_standard"
                                    placeholder="Bank details"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                  </div>
                  <div className="pt-6 mt-0 flex space-x-4">
                    <Button type="submit" disabled={isSubmitting}>
                      <span>{isSubmitting ? 'Saving..' : 'Received'}</span>
                    </Button>
                  </div>
                </form>
              </Form>
            )}
            <div className="text-xs font-light italic">
              Payment Status automally change to{' '}
              <span className="font-bold">&quot;PAID&quot;</span> once the
              Remaining Amount is paid.
            </div>
            <hr />

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
                    <td className="w-6 pl-4 app__td">
                      <Menu as="div" className="app__menu_container">
                        <div>
                          <MenuButton className="app__dropdown_btn">
                            <ChevronDown
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </MenuButton>
                        </div>

                        <Transition as={Fragment}>
                          <MenuItems className="app__dropdown_items">
                            <div className="py-1">
                              <MenuItem>
                                <div
                                  onClick={() => handleDeleteConfirmation(item)}
                                  className="app__dropdown_item"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                  <span>Delete</span>
                                </div>
                              </MenuItem>
                            </div>
                          </MenuItems>
                        </Transition>
                      </Menu>
                    </td>
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
                      {item.type === 'PDC' && (
                        <Badge
                          className="cursor-pointer"
                          onClick={() => handlePaymentReceived(item)}
                          variant="blue"
                        >
                          <CheckIcon /> Mark as Payed
                        </Badge>
                      )}
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
            <ConfirmationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onConfirm={handleDelete}
              message="Are you sure you want to delete this?"
            />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
