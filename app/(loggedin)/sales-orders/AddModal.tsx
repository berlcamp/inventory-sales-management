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
import { Customer, ProductStock, RootState, SalesOrder } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

const FormSchema = z.object({
  customer_id: z.coerce.number().min(1, 'Customer is required'),
  date: z.string().min(1, 'PO Date is required'),
  po_number: z.string().optional(),
  so_number: z.string().min(1, 'SO Number is required'),
  products: z.array(
    z.object({
      product_id: z.coerce.number().min(1, 'Product is required'),
      product_stock_id: z.coerce.number().min(1, 'Product is required'),
      quantity: z.coerce.number().min(1, 'Quantity is required'),
      unit_price: z.coerce.number().min(1, 'Price is required'),
      discount: z.coerce.number().optional(),
      total: z.coerce.number().min(0, 'Total is required')
    })
  )
})

type ProductStockType = {
  product_id?: number
  product_stock_id?: number
  quantity?: number
  unit_price?: number
  discount?: number
  total?: number
}

// Always update this on other pages
type FormType = z.infer<typeof FormSchema> & {
  id?: number
}
const title = 'Sales Order'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: SalesOrder | null // Optional prop for editing existing item
}

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [productsList, setProductsList] = useState<ProductStock[] | null>(null)
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const user = useAppSelector((state: RootState) => state.user.user)

  // Customers Dropdown
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
      so_number: '',
      customer_id: 0,
      products: [
        {
          product_id: 0,
          product_stock_id: 0,
          quantity: 0,
          unit_price: 0,
          discount: 0,
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
      return (
        sum + (product.unit_price * product.quantity - (product.discount ?? 0))
      )
    }, 0)
    const total = parseFloat(totalAmount.toFixed(2))

    try {
      // If editing an existing PO
      if (editData?.id) {
        const newData = {
          date: formdata.date,
          customer_id: formdata.customer_id,
          total_amount: total,
          po_number: formdata.po_number ?? '',
          so_number: formdata.so_number ?? ''
        }

        // Step 1: Delete existing sales order items
        const { error: deleteError } = await supabase
          .from('sales_order_items')
          .delete()
          .eq('sales_order_id', editData.id)

        if (deleteError) {
          console.error(
            'Error deleting existing sales order items:',
            deleteError
          )
          return
        }

        // Step 2: Update the sales order
        const { error: updateError } = await supabase
          .from('sales_orders')
          .update(newData)
          .eq('id', editData.id)

        if (updateError) {
          console.error('Error updating sales order:', updateError)
        } else {
          // Insert the new sales order items
          const salesOrderItems = formdata.products.map((product) => ({
            sales_order_id: editData.id, // Link to the updated PO
            product_stock_id: product.product_stock_id,
            unit_price: product.unit_price,
            discount: product.discount,
            quantity: product.quantity,
            total: product.total,
            product_id: product.product_id
          }))
          // for redux
          const salesOrderItemsRedux = formdata.products.map((product) => ({
            sales_order_id: editData.id,
            product_stock_id: product.product_stock_id,
            product_stock: productsList?.find(
              (p) => p.id.toString() === product.product_stock_id.toString()
            ),
            unit_price: product.unit_price,
            discount: product.discount,
            quantity: product.quantity,
            total: product.total,
            product_id: product.product_id
          }))

          const { error: insertError } = await supabase
            .from('sales_order_items')
            .insert(salesOrderItems)
            .select()

          if (insertError) {
            console.error('Error inserting sales order items:', insertError)
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
                po_number: editData.po_number,
                id: editData.id,
                customer: customers?.find(
                  (c) => c.id.toString() === formdata.customer_id.toString()
                ),
                order_items: salesOrderItemsRedux
              })
            )
            toast.success('sales Order updated successfully!')
            onClose()
          }
        }
      } else {
        const newData = {
          date: formdata.date,
          customer_id: formdata.customer_id,
          so_number: formdata.so_number,
          po_number: formdata.po_number ?? '',
          total_amount: total,
          status: 'draft',
          payment_status: 'unpaid'
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

          // Step 2: Insert the sales order items
          const salesOrderItems = formdata.products.map((product) => ({
            sales_order_id: newPOId, // Link to the new PO
            product_stock_id: product.product_stock_id,
            unit_price: product.unit_price,
            discount: product.discount,
            quantity: product.quantity,
            total: product.total,
            product_id: product.product_id
          }))
          // for redux
          const salesOrderItemsRedux = formdata.products.map((product) => ({
            sales_order_id: newPOId, // Link to the new PO
            product_stock_id: product.product_stock_id,
            product_stock: productsList?.find(
              (p) => p.id.toString() === product.product_stock_id.toString()
            ),
            unit_price: product.unit_price,
            discount: product.discount,
            quantity: product.quantity,
            total: product.total,
            product_id: product.product_id
          }))

          const { error: insertItemsError } = await supabase
            .from('sales_order_items')
            .insert(salesOrderItems)
            .select()

          if (insertItemsError) {
            console.error('Error adding sales order items:', insertItemsError)
          } else {
            // Update logs
            await supabase.from('product_change_logs').insert({
              sales_order_id: newPOId,
              user_id: user?.system_user_id,
              user_name: user?.name,
              message: `added this sales order`
            })

            // Update Redux with the new data
            dispatch(
              addItem({
                ...newData,
                customer: customers?.find(
                  (c) => c.id.toString() === formdata.customer_id.toString()
                ),
                order_items: salesOrderItemsRedux,
                id: newPOId
              })
            )
            toast.success('sales Order added successfully!')
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

  async function generateSONumber() {
    const fullYear = new Date().getFullYear()
    const shortYear = String(fullYear).slice(-2) // "25"

    const prefix = `${shortYear}`

    // Match like "25%"
    const { data, error } = await supabase
      .from('sales_orders')
      .select('so_number')
      .ilike('so_number', `${prefix}%`)
      .order('so_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextSeries = 1

    if (data.length > 0) {
      const lastPo = data[0].so_number // e.g., "PO-HDW-25010"
      const lastSeries = parseInt(lastPo.slice(-3), 10) // get last 3 digits
      nextSeries = lastSeries + 1
    }

    const paddedSeries = String(nextSeries).padStart(3, '0') // 010
    const newPoNumber = `${prefix}${paddedSeries}` // PO-HDW-25010

    return newPoNumber
  }

  useEffect(() => {
    const initForm = async () => {
      const soNumber = editData ? editData.so_number : await generateSONumber()

      form.reset({
        date: editData ? editData.date : '',
        customer_id: editData ? editData.customer_id : 0,
        po_number: editData ? editData.po_number : '',
        so_number: soNumber,
        products: editData?.order_items?.map((item) => ({
          product_id: item.product_id,
          product_stock_id: item.product_stock_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.unit_price * item.quantity // Calculate total (cost * quantity)
        })) || [
          {
            product_stock_id: 0,
            quantity: 0,
            unit_price: 0,
            discount: 0,
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
        .from('product_stocks')
        .select('*,product:product_id(*)')
        .order('purchase_date', { ascending: true })

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      setProductsList(data)
      setCustomers(customersData)
    }

    fetchData()
  }, [editData, isOpen])

  useEffect(() => {
    fields.forEach((item, index) => {
      const quantity = form.getValues(`products.${index}.quantity`)
      const discount = form.getValues(`products.${index}.discount`)

      // Set default values if empty
      if (!quantity) form.setValue(`products.${index}.quantity`, 1)
      if (!discount && discount !== 0)
        form.setValue(`products.${index}.discount`, 0)
    })
  }, [fields, form])

  const calculateTotal = (index: number) => {
    const quantity = form.getValues(`products.${index}.quantity`)
    const unit_price = form.getValues(`products.${index}.unit_price`)
    const discount = form.getValues(`products.${index}.discount`)
    const total = parseFloat(
      ((quantity ?? 0) * (unit_price ?? 0) - (discount ?? 0)).toFixed(2)
    )

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
                      name="po_number"
                      render={({ field }) => (
                        <FormItem className="max-w-40">
                          <FormLabel className="app__formlabel_standard">
                            Customer P.O. number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="P.O. number"
                              className="app__input_standard w-72!"
                              {...field}
                            />
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
                            name={`products.${index}.product_stock_id`}
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
                                        <span className="truncate">
                                          {field.value
                                            ? (() => {
                                                const selected =
                                                  productsList?.find(
                                                    (s) =>
                                                      s.id.toString() ===
                                                      field.value.toString()
                                                  )
                                                return selected?.product
                                                  ? `${selected.product.name}${
                                                      selected.product.sku
                                                        ? ` - ${selected.product.sku}`
                                                        : ''
                                                    }`
                                                  : 'Select product'
                                              })()
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
                                          {productsList?.map((s) => {
                                            const nameSku = s.product?.name
                                              ? `${s.product.name}${
                                                  s.product.sku
                                                    ? ` - ${s.product.sku}`
                                                    : ''
                                                }-${s.id}`
                                              : ''

                                            // Prevent selecting same product_stock_id twice
                                            const isAlreadySelected = form
                                              .watch('products')
                                              .some(
                                                (
                                                  p: ProductStockType,
                                                  i: number
                                                ) =>
                                                  p?.product_stock_id ===
                                                    s.id && i !== index
                                              )

                                            return (
                                              <CommandItem
                                                key={s.id}
                                                value={nameSku}
                                                onSelect={(selectedName) => {
                                                  if (isAlreadySelected) return // prevent selecting again

                                                  const selectedProduct =
                                                    productsList.find((sup) => {
                                                      const fullName = sup
                                                        .product?.name
                                                        ? `${sup.product.name}${
                                                            sup.product.sku
                                                              ? ` - ${sup.product.sku}`
                                                              : ''
                                                          }-${sup.id}`
                                                        : ''
                                                      return (
                                                        fullName.toLowerCase() ===
                                                        selectedName.toLowerCase()
                                                      )
                                                    })
                                                  if (selectedProduct) {
                                                    field.onChange(
                                                      selectedProduct.id
                                                    )
                                                    form.setValue(
                                                      `products.${index}.product_id`,
                                                      selectedProduct.product_id
                                                    )
                                                    form.setValue(
                                                      `products.${index}.unit_price`,
                                                      selectedProduct.selling_price
                                                    )
                                                    form.setValue(
                                                      `products.${index}.quantity`,
                                                      1
                                                    )
                                                    form.setValue(
                                                      `products.${index}.discount`,
                                                      0
                                                    )
                                                    calculateTotal(index)
                                                  }
                                                  setOpenProductDropdowns(
                                                    (prev) => ({
                                                      ...prev,
                                                      [index]: false
                                                    })
                                                  )
                                                }}
                                                disabled={isAlreadySelected}
                                                className="py-2"
                                              >
                                                <div className="flex flex-col w-full opacity-100">
                                                  <div
                                                    className="flex items-center justify-between"
                                                    title={nameSku}
                                                  >
                                                    <div className="font-medium truncate max-w-[65%]">
                                                      {s.product?.name}
                                                      {s.product?.sku && (
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                          - {s.product.sku}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <Check
                                                      className={cn(
                                                        'h-4 w-4',
                                                        s.id.toString() ===
                                                          field.value?.toString()
                                                          ? 'opacity-100'
                                                          : 'opacity-0'
                                                      )}
                                                    />
                                                  </div>
                                                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mt-1">
                                                    <div>
                                                      <span className="font-medium">
                                                        Purchased:
                                                      </span>{' '}
                                                      {new Date(
                                                        s.purchase_date
                                                      ).toLocaleDateString()}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Cost:
                                                      </span>{' '}
                                                      ₱ {s.cost.toFixed(2)}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Price:
                                                      </span>{' '}
                                                      ₱
                                                      {s.selling_price.toFixed(
                                                        2
                                                      )}
                                                    </div>
                                                    <div>
                                                      <span className="font-medium">
                                                        Remaining:
                                                      </span>{' '}
                                                      {s.remaining_quantity}
                                                    </div>
                                                  </div>
                                                </div>
                                              </CommandItem>
                                            )
                                          })}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.quantity`}
                            render={({ field }) => {
                              const selectedProductId = form.watch(
                                `products.${index}.product_stock_id`
                              )
                              const selectedProduct = productsList?.find(
                                (p) => p.id === selectedProductId
                              )
                              const maxQty =
                                selectedProduct?.remaining_quantity ?? 1

                              return (
                                <FormItem>
                                  {index === 0 && (
                                    <FormLabel className="app__formlabel_standard">
                                      Quantity
                                    </FormLabel>
                                  )}
                                  <FormControl>
                                    <Input
                                      className="app__input_standard"
                                      placeholder="Qty"
                                      type="number"
                                      step="1"
                                      min={1}
                                      max={maxQty}
                                      value={field.value}
                                      onChange={(e) => {
                                        const val = Math.min(
                                          maxQty,
                                          Math.max(1, parseInt(e.target.value))
                                        )
                                        field.onChange(val)
                                        calculateTotal(index)
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )
                            }}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`products.${index}.unit_price`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Unit Price
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard w-32 text-muted-foreground"
                                    placeholder="Price"
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
                            name={`products.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                {index === 0 && (
                                  <FormLabel className="app__formlabel_standard">
                                    Discount
                                  </FormLabel>
                                )}
                                <FormControl>
                                  <Input
                                    className="app__input_standard w-20"
                                    placeholder="Discount"
                                    type="number"
                                    step="any"
                                    min={0}
                                    {...field}
                                    onChange={(e) => {
                                      const val = Math.max(
                                        0,
                                        parseFloat(e.target.value)
                                      )
                                      field.onChange(val)
                                      calculateTotal(index)
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
                                    className="app__input_standard w-32 text-muted-foreground"
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
                            product_stock_id: 0,
                            unit_price: 0,
                            quantity: 0,
                            discount: 0,
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
