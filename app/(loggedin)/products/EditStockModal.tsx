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
  remaining_quantity: number
}
const table = 'product_stocks'
const title = 'Price'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  remaining_quantity: z.coerce.number().min(0, 'Remaining quantity is required')
})

export const EditStockModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const user = useAppSelector((state: RootState) => state.user.user)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      remaining_quantity: 0
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit

    if (editData?.remaining_quantity === data.remaining_quantity) {
      return
    }

    setIsSubmitting(true)

    try {
      const newData = {
        remaining_quantity: data.remaining_quantity
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
            message: `Updated price from ${editData.remaining_quantity} to ${data.remaining_quantity}`
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
              Change {title}
            </DialogTitle>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="app__formlabel_standard">
                      Current Remaining Quantity
                    </div>
                    <div className="app__formlabel_standard">
                      {editData?.remaining_quantity}
                    </div>
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="remaining_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            New Remaining Quantity
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
