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
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { addItem, updateList } from '@/store/listSlice'
import { Product, PurchaseOrder, RootState, Supplier } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

const FormSchema = z.object({
  supplier_id: z.coerce.number().min(1, 'Supplier is required'),
  date: z.string().min(1, 'PO Date is required'),
  po_number: z.string().min(1, 'PO Number is required'),
  remarks: z.string().optional(),
  products: z.array(
    z.object({
      product_id: z.coerce.number().min(1, 'Product is required'),
      quantity: z.coerce.number().min(1, 'Quantity is required'),
      cost: z.coerce.number().min(1, 'Cost is required'),
      price: z.coerce.number().min(1, 'Selling Price is required'),
      total: z.coerce.number().min(0, 'Total is required')
    })
  )
})

// Always update this on other pages
type FormType = z.infer<typeof FormSchema> & {
  id?: number
}
const title = 'Purchase Order'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: PurchaseOrder | null // Optional prop for editing existing item
}

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [productsList, setProductsList] = useState<Product[] | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const user = useAppSelector((state: RootState) => state.user.user)

  // Suppliers Dropdown
  const [open, setOpen] = useState(false)

  // Product dropdown
  const [openProductDropdowns, setOpenProductDropdowns] = useState<{
    [key: number]: boolean
  }>({})

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: '',
      po_number: '',
      supplier_id: 0,
      products: [
        {
          product_id: 0,
          quantity: 0,
          cost: 0,
          price: 0,
          total: 0
        }
      ]
    }
  })

  const { control } = form
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'products'
  })

  // get the running total
  const products = form.watch('products') || []
  const runningTotal = products.reduce((sum, item) => {
    return sum + (item.total || 0)
  }, 0)

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    // Calculate the total amount
    const totalAmount = formdata.products.reduce((sum, product) => {
      return sum + product.cost * product.quantity
    }, 0)
    const total = parseFloat(totalAmount.toFixed(2))

    try {
      // If editing an existing PO
      if (editData?.id) {
        const newData = {
          date: formdata.date,
          supplier_id: formdata.supplier_id,
          remarks: formdata.remarks,
          po_number: formdata.po_number,
          total_amount: total,
          company_id: user?.company_id
        }

        // Step 1: Delete existing purchase order items
        const { error: deleteError } = await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', editData.id)

        if (deleteError) {
          console.error(
            'Error deleting existing purchase order items:',
            deleteError
          )
          return
        }

        // Step 2: Update the purchase order
        const { error: updateError } = await supabase
          .from('purchase_orders')
          .update(newData)
          .eq('id', editData.id)

        if (updateError) {
          console.error('Error updating purchase order:', updateError)
        } else {
          // Insert the new purchase order items
          const purchaseOrderItems = formdata.products.map((product) => ({
            purchase_order_id: editData.id,
            product_id: product.product_id,
            cost: product.cost,
            price: product.price,
            quantity: product.quantity,
            to_deliver: product.quantity
          }))
          // for redux
          const purchaseOrderItemsRedux = formdata.products.map((product) => ({
            purchase_order_id: editData.id,
            product_id: product.product_id,
            cost: product.cost,
            price: product.price,
            quantity: product.quantity,
            to_deliver: product.quantity,
            product: productsList?.find(
              (p) => p.id.toString() === product.product_id.toString()
            )
          }))

          const { error: insertError } = await supabase
            .from('purchase_order_items')
            .insert(purchaseOrderItems)

          if (insertError) {
            console.error('Error inserting purchase order items:', insertError)
          } else {
            // Update logs
            await supabase.from('product_change_logs').insert({
              po_id: editData.id,
              user_id: user?.system_user_id,
              user_name: user?.name,
              message: `updated this purchase order`
            })

            // Update Redux state
            dispatch(
              updateList({
                ...editData,
                ...newData,
                po_number: formdata.po_number,
                id: editData.id,
                supplier: suppliers?.find(
                  (c) => c.id.toString() === formdata.supplier_id.toString()
                ),
                order_items: purchaseOrderItemsRedux
              })
            )
            toast.success('Purchase Order updated successfully!')
            onClose()
          }
        }
      } else {
        const newData = {
          date: formdata.date,
          supplier_id: formdata.supplier_id,
          po_number: formdata.po_number, // Generate the PO number (you can use a custom function)
          total_amount: total,
          remarks: formdata.remarks,
          status: 'draft',
          payment_status: 'unpaid',
          company_id: user?.company_id
        }

        // If adding a new PO
        const { data: insertedPO, error: insertPOError } = await supabase
          .from('purchase_orders')
          .insert([newData])
          .select()

        if (insertPOError) {
          console.error('Error adding purchase order:', insertPOError)
          return
        } else {
          const newPOId = insertedPO[0].id // Get the inserted PO ID

          // Step 2: Insert the purchase order items
          const purchaseOrderItems = formdata.products.map((product) => ({
            purchase_order_id: newPOId, // Link to the new PO
            product_id: product.product_id,
            cost: product.cost,
            price: product.price,
            quantity: product.quantity,
            to_deliver: product.quantity
          }))
          // for redux
          const purchaseOrderItemsRedux = formdata.products.map((product) => ({
            purchase_order_id: newPOId, // Link to the new PO
            product_id: product.product_id,
            cost: product.cost,
            price: product.price,
            quantity: product.quantity,
            to_deliver: product.quantity,
            product: productsList?.find(
              (p) => p.id.toString() === product.product_id.toString()
            )
          }))

          const { error: insertItemsError } = await supabase
            .from('purchase_order_items')
            .insert(purchaseOrderItems)
            .select()

          if (insertItemsError) {
            console.error(
              'Error adding purchase order items:',
              insertItemsError
            )
          } else {
            // Update logs
            await supabase.from('product_change_logs').insert({
              po_id: newPOId,
              user_id: user?.system_user_id,
              user_name: user?.name,
              message: `added this purchase order`
            })

            // Update Redux with the new data
            dispatch(
              addItem({
                ...newData,
                order_items: purchaseOrderItemsRedux,
                supplier: suppliers?.find(
                  (c) => c.id.toString() === formdata.supplier_id.toString()
                ),
                id: newPOId
              })
            )
            toast.success('Purchase Order added successfully!')
            onClose()
          }
        }
      }
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // async function generatePONumber() {
  //   const fullYear = new Date().getFullYear()
  //   const shortYear = String(fullYear).slice(-2) // "25"

  //   const prefix = `PO-HDW-${shortYear}`

  //   // Match like "PO-HDW-25%"
  //   const { data, error } = await supabase
  //     .from('purchase_orders')
  //     .select('po_number')
  //     .eq('company_id', user?.company_id)
  //     .ilike('po_number', `${prefix}%`)
  //     .order('po_number', { ascending: false })
  //     .limit(1)

  //   if (error) throw error

  //   let nextSeries = 1

  //   if (data.length > 0) {
  //     const lastPo = data[0].po_number // e.g., "PO-HDW-25010"
  //     const lastSeries = parseInt(lastPo.slice(-3), 10) // get last 3 digits
  //     nextSeries = lastSeries + 1
  //   }

  //   const paddedSeries = String(nextSeries).padStart(3, '0') // 010
  //   const newPoNumber = `${prefix}${paddedSeries}` // PO-HDW-25010

  //   return newPoNumber
  // }

  useEffect(() => {
    const initForm = async () => {
      const poNumber = editData ? editData.po_number : ''

      form.reset({
        date: editData ? editData.date : '',
        po_number: poNumber,
        supplier_id: editData ? editData.supplier_id : 0,
        products: editData?.order_items?.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          cost: item.cost,
          price: item.price ?? 0,
          total: item.cost * item.quantity
        })) || [
          {
            product_id: 0,
            quantity: 0,
            cost: 0,
            price: 0,
            total: 0
          }
        ]
      })
    }

    if (isOpen) {
      initForm()
    }
  }, [form, editData, isOpen])

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', user?.company_id)
        .order('name', { ascending: true })

      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', user?.company_id)
        .order('name', { ascending: true })

      setProductsList(data)
      setSuppliers(suppliersData)
    }

    fetchData()
  }, [user?.company_id])

  const calculateTotal = (index: number) => {
    const quantity = form.getValues(`products.${index}.quantity`)
    const cost = form.getValues(`products.${index}.cost`)
    const total = parseFloat(((quantity ?? 0) * (cost ?? 0)).toFixed(2))

    // Set the calculated total back into the form
    form.setValue(`products.${index}.total`, total)
  }

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
        <DialogPanel transition className="app__modal_dialog_panel_lg">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <DialogTitle as="h3" className="text-base font-medium">
              {editData ? 'Edit' : 'Add'} {title}
            </DialogTitle>
          </div>
          {/* Scrollable Form Content */}
          <div className="lg:hidden app__modal_dialog_content">
            <div>P.O. can only be created a large screen devices</div>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          <div className="hidden lg:block app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="max-w-40">
                          <FormLabel className="app__formlabel_standard">
                            P.O. Date
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
                      name="po_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            PO Number
                          </FormLabel>

                          <FormControl>
                            <Input className="app__input_standard" {...field} />
                          </FormControl>
                          {/* <FormMessage /> */}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="supplier_id"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="app__formlabel_standard">
                            Supplier
                          </FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-full justify-between hover:bg-white',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? suppliers?.find(
                                        (s) =>
                                          s.id.toString() ===
                                          field.value.toString()
                                      )?.name
                                    : 'Select supplier'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search category..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No supplier found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {suppliers?.map((s) => (
                                      <CommandItem
                                        value={s.name}
                                        key={s.id}
                                        onSelect={(selectedName) => {
                                          const selectedSupplier =
                                            suppliers.find(
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
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Remarks (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Remarks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center">
                      <div className="flex-grow bg-gray-300 h-px"></div>
                      <div className="mx-4 my-4 text-gray-500 text-sm">
                        Product Items
                      </div>
                      <div className="flex-grow bg-gray-300 h-px"></div>
                    </div>

                    {fields.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-8 space-y-2 gap-2 items-center"
                      >
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`products.${index}.product_id`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Product
                                  </FormLabel>
                                )}
                                <Popover
                                  open={openProductDropdowns[index] || false}
                                  onOpenChange={(isOpen) =>
                                    setOpenProductDropdowns((prev) => ({
                                      ...prev,
                                      [index]: isOpen
                                    }))
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          'w-full justify-between hover:bg-white',
                                          !field.value &&
                                            'text-muted-foreground'
                                        )}
                                      >
                                        <span className="truncate w-[350px]">
                                          {' '}
                                          {/* Truncate the text if it's too long */}
                                          {field.value
                                            ? productsList?.find(
                                                (s) =>
                                                  s.id.toString() ===
                                                  field.value.toString()
                                              )?.name
                                            : 'Select product'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[700px] p-0">
                                    <Command>
                                      <CommandInput placeholder="Search product..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          No product found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {productsList?.map((s) => (
                                            <CommandItem
                                              value={s.name}
                                              key={s.id}
                                              onSelect={(selectedName) => {
                                                const selectedProduct =
                                                  productsList.find(
                                                    (sup) =>
                                                      sup.name.toLowerCase() ===
                                                      selectedName.toLowerCase()
                                                  )
                                                if (selectedProduct) {
                                                  field.onChange(
                                                    selectedProduct.id
                                                  ) // store category.id in form
                                                }
                                                setOpenProductDropdowns(
                                                  (prev) => ({
                                                    ...prev,
                                                    [index]: false
                                                  })
                                                )
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
                                {/* <FormMessage /> */}
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Quantity
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard"
                                    placeholder="Quantity"
                                    type="number"
                                    step="any"
                                    min={1}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      calculateTotal(index) // Automatically update total on quantity change
                                    }}
                                  />
                                </FormControl>
                                {/* <FormMessage /> */}
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.cost`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Unit Price
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard"
                                    placeholder="Unit Price"
                                    type="number"
                                    step="any"
                                    min={1}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      calculateTotal(index) // Automatically update total on quantity change
                                    }}
                                  />
                                </FormControl>
                                {/* <FormMessage /> */}
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Total Amount Field */}
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.total`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Total
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard"
                                    type="number"
                                    step="any"
                                    {...field}
                                    readOnly
                                  />
                                </FormControl>
                                {/* <FormMessage /> */}
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Selling Price
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard"
                                    placeholder="Selling Price"
                                    type="number"
                                    step="any"
                                    min={1}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                    }}
                                  />
                                </FormControl>
                                {/* <FormMessage /> */}
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          {fields.length > 1 && (
                            <Trash2Icon
                              onClick={() => remove(index)}
                              className="text-red-500 w-5 h-5"
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-center p-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          append({
                            product_id: 0,
                            cost: 0,
                            price: 0,
                            quantity: 0,
                            total: 0
                          })
                        }
                      >
                        <PlusIcon className="w-5 h-5" /> Add More Item
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-right font-semibold text-lg">
                  Total Amount: &nbsp;
                  {runningTotal?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className="app__modal_dialog_footer">
                  <Button type="button" onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
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
