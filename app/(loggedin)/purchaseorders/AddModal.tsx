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
import { useAppDispatch } from '@/store/hook'
import { addItem, updateList } from '@/store/listSlice'
import { Product, PurchaseOrder, Supplier } from '@/types'
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
  products: z.array(
    z.object({
      product_id: z.coerce.number().min(1, 'Product is required'),
      quantity: z.coerce.number().min(1, 'Quantity is required'),
      cost: z.coerce.number().min(1, 'Cost is required'),
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
      supplier_id: 0,
      products: [
        {
          product_id: 0,
          quantity: 0,
          cost: 0,
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
          total_amount: total
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
            quantity: product.quantity
          }))
          // for redux
          const purchaseOrderItemsRedux = formdata.products.map((product) => ({
            purchase_order_id: editData.id,
            product_id: product.product_id,
            cost: product.cost,
            quantity: product.quantity,
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
            // Update Redux state
            dispatch(
              updateList({
                ...editData,
                ...newData,
                po_number: editData.po_number,
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
          po_number: generatePONumber(), // Generate the PO number (you can use a custom function)
          total_amount: total,
          status: 'draft',
          payment_status: 'unpaid'
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
            quantity: product.quantity
          }))
          // for redux
          const purchaseOrderItemsRedux = formdata.products.map((product) => ({
            purchase_order_id: newPOId, // Link to the new PO
            product_id: product.product_id,
            cost: product.cost,
            quantity: product.quantity,
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

  function generatePONumber() {
    const date = new Date()
    return `PO-${date.getFullYear()}-${(
      '000' +
      (Math.floor(Math.random() * 9999) + 1)
    ).slice(-4)}`
  }

  useEffect(() => {
    form.reset({
      date: editData ? editData.date : '',
      supplier_id: editData ? editData.supplier_id : 0,
      products: editData?.order_items?.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        cost: item.cost,
        total: item.cost * item.quantity // Calculate total (cost * quantity)
      })) || [
        {
          product_id: 0,
          quantity: 0,
          cost: 0,
          total: 0
        }
      ]
    })
  }, [form, editData, isOpen])

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      setProductsList(data)
      setSuppliers(suppliersData)
    }

    fetchData()
  }, [])

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
        <DialogPanel transition className="app__modal_dialog_panel">
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
                        className="grid grid-cols-5 space-y-2 gap-2 items-center"
                      >
                        <div>
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
                                            'text-muted-foreground',
                                          'max-w-40' // Add max width to the button
                                        )}
                                      >
                                        <span className="truncate">
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
                                  <PopoverContent className="w-full p-0">
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
