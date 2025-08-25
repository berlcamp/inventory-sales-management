// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { addItem, updateList } from '@/store/listSlice'
import { Customer, RootState, SalesOrder } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

const FormSchema = z.object({
  customer_id: z.coerce.number().min(1, 'Customer is required'),
  date: z.string().min(1, 'PO Date is required'),
  other_charges: z.string().min(1, 'Description is required'),
  other_charges_amount: z.coerce.number(),
  so_number: z.string().min(1, 'SO Number is required')
})

// Always update this on other pages
type FormType = z.infer<typeof FormSchema> & {
  id?: number
}
const title = 'Other Charges'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: SalesOrder | null // Optional prop for editing existing item
}

export const OtherChargesModal = ({
  isOpen,
  onClose,
  editData
}: ModalProps) => {
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const user = useAppSelector((state: RootState) => state.user.user)

  // Customers Dropdown
  const [open, setOpen] = useState(false)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: '',
      so_number: '',
      customer_id: 0,
      other_charges: '',
      other_charges_amount: 0
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      // If editing an existing PO
      if (editData?.id) {
        const newData = {
          date: formdata.date,
          customer_id: formdata.customer_id,
          other_charges: formdata.other_charges,
          other_charges_amount: formdata.other_charges_amount,
          total_amount: formdata.other_charges_amount,
          so_number: formdata.so_number ?? '',
          company_id: user?.company_id
        }

        // Step 2: Update the sales order
        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(newData)
          .eq('id', editData.id)

        if (updateError) {
          console.error('Error updating sales order:', updateError)
        } else {
          // Update logs
          await supabase.from('product_change_logs').insert({
            sales_order_id: editData.id,
            user_id: user?.system_user_id,
            user_name: user?.name,
            message: `updated this sales order`
          })

          // Update Redux state
          dispatch(
            updateList({
              ...editData,
              ...newData,
              id: editData.id,
              customer: customers?.find(
                (c) => c.id.toString() === formdata.customer_id.toString()
              )
            })
          )
          toast.success('sales Order updated successfully!')
          onClose()
        }
      } else {
        const newData = {
          date: formdata.date,
          customer_id: formdata.customer_id,
          other_charges: formdata.other_charges,
          other_charges_amount: formdata.other_charges_amount,
          so_number: formdata.so_number,
          total_amount: formdata.other_charges_amount,
          status: 'reserved',
          payment_status: 'unpaid',
          company_id: user?.company_id
        }

        // If adding a new PO
        const { data: insertedPO, error: insertPOError } = await supabase
          .from('sales_orders')
          .insert([newData])
          .select()

        if (insertPOError) {
          console.error('Error adding sales order:', insertPOError)
          return
        } else {
          const newPOId = insertedPO[0].id // Get the inserted PO ID

          // Update logs
          await supabase.from('product_change_logs').insert({
            sales_order_id: newPOId,
            user_id: user?.system_user_id,
            user_name: user?.name,
            message: `created this sales order`
          })

          // Update Redux with the new data
          dispatch(
            addItem({
              ...newData,
              customer: customers?.find(
                (c) => c.id.toString() === formdata.customer_id.toString()
              ),
              id: newPOId
            })
          )
          toast.success('sales Order added successfully!')
          onClose()
        }
      }
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const initForm = async () => {
      // const soNumber = editData ? editData.so_number : await generateSONumber()
      const soNumber = editData ? editData.so_number : ''

      form.reset({
        date: editData ? editData.date : '',
        customer_id: editData ? editData.customer_id : 0,
        other_charges: editData ? editData.other_charges ?? '' : '',
        other_charges_amount: editData ? editData.other_charges_amount ?? 0 : 0,
        so_number: soNumber
      })
    }
    if (isOpen) {
      initForm()
    }
  }, [form, editData, isOpen])

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', user?.company_id)
        .order('name', { ascending: true })

      setCustomers(customersData)
    }

    fetchData()
  }, [editData, isOpen, user?.company_id])

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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <DialogPanel transition className="app__modal_dialog_panel">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              {editData ? 'Edit' : 'Add'} {title}
            </DialogTitle>
          </div>
          {/* Scrollable Form Content */}
          <div className="lg:hidden app__modal_dialog_content">
            <div>S.O. can only be created a large screen devices</div>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          <div className="hidden lg:block app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="max-w-40">
                          <FormLabel className="app__formlabel_standard">
                            S.O. Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
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
                      name="so_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Sales Order Number
                          </FormLabel>

                          <FormControl>
                            <Input className="app__input_standard" {...field} />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customer_id"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="app__formlabel_standard">
                            Customer
                          </FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-72 justify-between hover:bg-white',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? customers?.find(
                                        (s) =>
                                          s.id.toString() ===
                                          field.value.toString()
                                      )?.name
                                    : 'Select customer'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search customer..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No customer found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {customers?.map((s) => (
                                      <CommandItem
                                        value={s.name}
                                        key={s.id}
                                        onSelect={(selectedName) => {
                                          const selectedSupplier =
                                            customers.find(
                                              (sup) =>
                                                sup.name.toLowerCase() ===
                                                selectedName.toLowerCase()
                                            )
                                          if (selectedSupplier) {
                                            field.onChange(selectedSupplier.id) // store category.id in form
                                          }
                                          setOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            s.id.toString() ===
                                              field.value?.toString()
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {s.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="other_charges"
                      render={({ field }) => (
                        <FormItem className="max-w-40">
                          <FormLabel className="app__formlabel_standard">
                            Other Charges (Description)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Other Charges (Description)"
                              className="app__input_standard w-72!"
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
                      name="other_charges_amount"
                      render={({ field }) => (
                        <FormItem className="max-w-40">
                          <FormLabel className="app__formlabel_standard">
                            Other Charges (Amount)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              className="app__input_standard w-72!"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <div className="flex"></div>
                  </div>
                </div>
                <div className="app__modal_dialog_footer">
                  <Button type="button" onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editData ? (
                      'Update'
                    ) : (
                      <span>{isSubmitting ? 'Saving..' : 'Save'}</span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
