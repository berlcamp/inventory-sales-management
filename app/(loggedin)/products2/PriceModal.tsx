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
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { updateList } from '@/store/stocksSlice'
import { ProductStock, RootState } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'

// Always update this on other pages
type ItemType = ProductStock
type FormType = {
  selling_price: number
}
const table = 'product_stocks'
const title = 'Price'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  selling_price: z.coerce.number().min(1, 'Selling price is required')
})

export const PriceModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const user = useAppSelector((state: RootState) => state.user.user)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selling_price: 0
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit

    if (editData?.selling_price === data.selling_price) {
      return
    }

    setIsSubmitting(true)

    try {
      const newData = {
        selling_price: data.selling_price
      }

      // If exists (editing), update it
      if (editData?.id) {
        const { error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)

        if (error) {
          console.error('Error updating:', error)
        } else {
          // Update logs
          await supabase.from('product_change_logs').insert({
            product_id: editData?.product_id,
            product_stock_id: editData?.id,
            user_id: user?.system_user_id,
            user_name: user?.name,
            message: `Updated price from ${editData.selling_price} to ${data.selling_price}`
          })

          //Update list on redux
          dispatch(
            updateList({
              ...editData,
              ...newData,
              id: editData.id
            })
          ) // ✅ Update Redux with new data
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
      selling_price: editData?.selling_price || 0
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
              Change {title}
            </DialogTitle>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="app__formlabel_standard">Current Price</div>
                    <div className="app__formlabel_standard">
                      {editData?.selling_price}
                    </div>
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="selling_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            New Price
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
