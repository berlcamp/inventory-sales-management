// components/AddItemTypeModal.tsx
'use client'

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
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addItem, updateList } from '@/store/stocksSlice'
import { ProductStock } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

// Always update this on other pages
type ItemType = ProductStock
type FormType = {
  purchase_date: string
  cost: number
  selling_price: number
  quantity: number
  remaining_quantity: number
}
const table = 'product_stocks'
const title = 'Stock'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
  productId: number
}

const FormSchema = z.object({
  purchase_date: z.string().min(1, 'Purchase date is required'),
  cost: z.coerce.number().min(1, 'Purchase cost is required'),
  selling_price: z.coerce.number().min(1, 'Selling price is required'),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  remaining_quantity: z.coerce.number().min(1, 'Quantity is required')
})

export const AddStockModal = ({
  isOpen,
  onClose,
  editData,
  productId
}: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      purchase_date: '',
      cost: 0,
      selling_price: 0,
      quantity: 0,
      remaining_quantity: 0
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        product_id: productId,
        purchase_date: data.purchase_date,
        cost: data.cost,
        selling_price: data.selling_price,
        quantity: data.quantity,
        remaining_quantity: data.remaining_quantity
      }

      // If exists (editing), update it
      if (editData?.id) {
        const { error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)

        if (error) {
          console.error('Error updating ItemType:', error)
        } else {
          //Update list on redux
          dispatch(
            updateList({
              ...newData,
              id: editData.id
            })
          ) // ✅ Update Redux with new data
          onClose()
        }
      } else {
        // Add new one
        const { data, error } = await supabase
          .from(table)
          .insert([newData])
          .select()

        if (error) {
          console.error('Error adding stock:', error)
        } else {
          // Insert new item to Redux
          dispatch(
            addItem({
              ...newData,
              id: data[0].id
            })
          )
          onClose()
        }
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    form.reset({
      purchase_date: editData?.purchase_date || '',
      cost: editData?.cost || 0,
      selling_price: editData?.selling_price || 0,
      quantity: editData?.quantity || 0,
      remaining_quantity: editData?.remaining_quantity || 0
    })
  }, [form, editData, isOpen])

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
        <DialogPanel transition className="app__modal_dialog_panel_sm">
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
                      name="purchase_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Purchase Date
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
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Purchase Cost
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Purchase Cost"
                              type="number"
                              step="any"
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
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Selling Price
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Selling Price"
                              type="number"
                              step="any"
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
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Total Quantity
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Selling Price"
                              type="number"
                              step="any"
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
                      name="remaining_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Remaining Quantity
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Remaining Quantity"
                              type="number"
                              step="any"
                              {...field}
                            />
                          </FormControl>
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
