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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addItem, updateList } from '@/store/listSlice'
import { AddUserFormValues, User } from '@/types'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Always update this on other pages
type ItemType = User
type FormType = AddUserFormValues
const table = 'users'
const title = 'User'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email({ message: 'Invalid email address' }),
  type: z.string().min(1, 'Type is required'),
  is_active: z.boolean()
})

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  const dispatch = useAppDispatch()
  console.log('editData', editData)
  const supabase2 = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY ?? '',
    {
      db: {
        schema: 'sffo' // ✅ Use the custom schema by default
      }
    }
  )

  function generatePassword(length = 12) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?'
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
      .map((x) => chars[x % chars.length])
      .join('')
  }

  // Initialize the form with existing ItemType data if provided
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      email: '',
      type: '',
      is_active: true
    }
  })

  // Submit handler
  const onSubmit = async (formData: FormType) => {
    if (editData?.id) {
      const { error } = await supabase2.auth.admin.updateUserById(editData.id, {
        email: formData.email,
        user_metadata: { sffo_role: formData.type }
      })

      if (error) {
        console.error('Error updating user:', error.message)
        return
      }

      const updatedData = {
        name: formData.name,
        email: editData.email,
        type: formData.type,
        is_active: formData.is_active
      }

      const { error: error2 } = await supabase
        .from(table)
        .update(updatedData)
        .eq('id', editData.id)

      if (error2) {
        console.error('Error updating user in table:', error2.message)
      } else {
        dispatch(updateList({ ...updatedData, id: editData.id }))
        onClose()
      }
      return
    }

    let userId: string | null = null
    const password = generatePassword()

    const { data: createdUser, error } = await supabase2.auth.admin.createUser({
      email: formData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        sffo_role: formData.type
      }
    })

    if (error) {
      if (error.code === 'email_exists') {
        const { data: usersList, error: fetchError } =
          await supabase2.auth.admin.listUsers()
        if (fetchError) {
          console.error('Error fetching users:', fetchError.message)
          return
        }

        const existing = usersList.users.find((u) => u.email === formData.email)
        if (!existing) {
          console.error('User exists but cannot find the ID')
          return
        }

        userId = existing.id
      } else {
        console.error('Error creating user:', error.message)
        return
      }
    } else {
      userId = createdUser.user?.id || null
    }

    if (userId) {
      const newData = {
        id: userId,
        name: formData.name,
        email: formData.email,
        password: password,
        type: formData.type,
        is_active: formData.is_active
      }
      console.log('newData', newData)
      const { data: insertedUser, error: error2 } = await supabase
        .from(table)
        .insert(newData)
        .select()

      if (error2) {
        console.error('Error inserting user into table:', error2.message)
      } else {
        dispatch(addItem({ ...newData, id: insertedUser[0].id }))
        onClose()
      }
    }
  }

  useEffect(() => {
    form.reset({
      name: editData?.name || '',
      email: editData?.email || '',
      type: editData?.type || '',
      is_active: editData ? editData.is_active : false
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
                            Fullname
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Fullname"
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
                      disabled={editData ? true : false}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Email"
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="app__input_standard">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => {
                        const stringValue =
                          field.value === true ? 'true' : 'false'

                        return (
                          <FormItem>
                            <FormLabel className="app__formlabel_standard">
                              Status
                            </FormLabel>
                            <Select
                              value={stringValue}
                              onValueChange={(value) =>
                                field.onChange(value === 'true')
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="app__input_standard">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />
                  </div>
                </div>

                <div className="app__modal_dialog_footer">
                  <Button type="button" onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editData ? 'Update' : <span>Save</span>}
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
