/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { updateList } from '@/store/listSlice'
import { Category, Product, RootState } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

// Always update this on other pages
type ItemType = Product
type FormType = {
  name: string
  unit: string
  category_id: number
}
const table = 'products'
const title = 'Product'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  name: z.string().min(1, 'Product Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  category_id: z.coerce.number().min(1, 'Category is required')
})

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const list = useAppSelector((state: RootState) => state.list.value)

  // Category dropdown
  const [open, setOpen] = useState(false)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: editData ? editData.name : '',
      unit: editData ? editData.unit : '',
      category_id: editData ? editData.category_id : 0
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const newData = {
        name: data.name,
        unit: data.unit,
        category_id: data.category_id,
        company_id: process.env.NEXT_PUBLIC_COMPANY_ID
      }

      if (editData?.id) {
        // UPDATE EXISTING PRODUCT
        const { data: updated, error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)
          .select('*, category:category_id(*)')

        if (error) {
          console.error('Error updating product:', error)
          toast.error('Failed to update product.')
        } else if (updated && updated[0]) {
          const updatedProduct = {
            ...updated[0],
            category:
              updated[0].category ||
              categories?.find((c) => c.id === newData.category_id)
          }

          // Get old and new category IDs
          const oldCategoryId = editData.category_id
          const newCategoryId = updatedProduct.category_id

          // ✅ Dispatch update for old category (remove the product)
          if (oldCategoryId && oldCategoryId !== newCategoryId) {
            const oldCategory = list.find((cat) => cat.id === oldCategoryId)
            if (oldCategory) {
              dispatch(
                updateList({
                  ...oldCategory,
                  products: oldCategory.products?.filter(
                    (p: Product) => p.id !== updatedProduct.id
                  )
                })
              )
            }
          }

          // ✅ Dispatch update for new category (add/update the product)
          const newCategory = list.find((cat) => cat.id === newCategoryId)
          if (newCategory) {
            const alreadyExists = newCategory.products?.some(
              (p: Product) => p.id === updatedProduct.id
            )
            dispatch(
              updateList({
                ...newCategory,
                products: alreadyExists
                  ? newCategory.products?.map((p: Product) =>
                      p.id === updatedProduct.id ? updatedProduct : p
                    )
                  : [...(newCategory.products || []), updatedProduct]
              })
            )
          }

          toast.success('Product updated successfully!')
          onClose()
        }
      } else {
        // ADD NEW PRODUCT
        const { data: inserted, error } = await supabase
          .from(table)
          .insert([newData])
          .select('*, category:category_id(*)')

        if (error) {
          console.error('Error adding product:', error)
          toast.error('Failed to add product.')
        } else if (inserted && inserted[0]) {
          const newProduct = {
            ...inserted[0],
            category:
              inserted[0].category ||
              categories?.find((c) => c.id === newData.category_id)
          }

          const targetCategory = list.find(
            (cat) => cat.id === newProduct.category_id
          )

          if (targetCategory) {
            dispatch(
              updateList({
                ...targetCategory,
                products: [...(targetCategory.products || []), newProduct]
              })
            )
          }

          toast.success('Product added successfully!')
          onClose()
        }
      }
    } catch (err) {
      console.error('Submission error:', err)
      toast.error('Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    form.reset({
      name: editData?.name || '',
      unit: editData?.unit || '',
      category_id: editData?.category_id || 0
    })
  }, [form, editData, isOpen])

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', process.env.NEXT_PUBLIC_COMPANY_ID)
        .order('name', { ascending: true })

      setCategories(data)
    }

    console.log('categories fetched from modal')
    fetchData()
  }, [])

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
            <DialogTitle as="h3" className="text-base font-medium">
              {editData ? 'Edit' : 'Add'} {title}
            </DialogTitle>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Product Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Product Name"
                              type="text"
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
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Unit
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Unit"
                              type="text"
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
                      name="category_id"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="app__formlabel_standard">
                            Category
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
                                    ? categories?.find(
                                        (cat) =>
                                          cat.id.toString() ===
                                          field.value.toString()
                                      )?.name
                                    : 'Select Category'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search category..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No category found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {categories?.map((cat) => (
                                      <CommandItem
                                        value={cat.name}
                                        key={cat.id}
                                        onSelect={(selectedName) => {
                                          const selectedCategory =
                                            categories.find(
                                              (c) =>
                                                c.name.toLowerCase() ===
                                                selectedName.toLowerCase()
                                            )
                                          if (selectedCategory) {
                                            field.onChange(selectedCategory.id) // store category.id in form
                                          }
                                          setOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            cat.id.toString() ===
                                              field.value?.toString()
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {cat.name}
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
