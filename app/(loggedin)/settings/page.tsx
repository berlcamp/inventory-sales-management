'use client'

import LoadingSkeleton from '@/components/LoadingSkeleton'
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
import { RootState, Settings } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { z } from 'zod'

const FormSchema = z.object({
  shipping_company: z.string().min(1, 'Name is required'),
  shipping_address: z.string().min(1, 'Name is required'),
  shipping_contact_number: z.string().min(1, 'Contact No is required'),
  billing_company: z.string().min(1, 'Contact No is required'),
  billing_address: z.string().min(1, 'Address is required'),
  billing_contact_number: z.string().min(1, 'Address is required')
})

type FormType = z.infer<typeof FormSchema>

export default function Page() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)

  const user = useSelector((state: RootState) => state.user.user)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      shipping_company: '',
      shipping_address: '',
      shipping_contact_number: '',
      billing_company: '',
      billing_address: '',
      billing_contact_number: ''
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    try {
      const newData = {
        shipping_company: formdata.shipping_company,
        shipping_address: formdata.shipping_address,
        shipping_contact_number: formdata.shipping_contact_number,
        billing_company: formdata.billing_company,
        billing_address: formdata.billing_address,
        billing_contact_number: formdata.billing_contact_number
      }

      const { error } = await supabase
        .from('settings')
        .update(newData)
        .eq('id', 1)

      if (error) {
        console.error('Error updating settings:', error.message)
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error('Submission error:', err)
    }
  }

  // Fetch data on page load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) {
        console.error(error)
      } else {
        console.log('data', data)
        setSettings(data)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Fetch data on page load
  useEffect(() => {
    form.reset({
      shipping_company: settings?.shipping_company ?? '',
      shipping_address: settings?.shipping_address ?? '',
      shipping_contact_number: settings?.shipping_contact_number ?? '',
      billing_company: settings?.billing_company ?? '',
      billing_address: settings?.billing_address ?? '',
      billing_contact_number: settings?.billing_contact_number ?? ''
    })
  }, [form, settings])

  if (user?.user_metadata?.sffo_role !== 'admin') {
    window.location.href = '/'
  }

  return (
    <div>
      <div className="app__title">
        <h1 className="text-3xl font-semibold">Settings</h1>
      </div>
      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton />}
      <div className="mt-4 px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="font-bold text-lg my-8">Shipping Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="shipping_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Company Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Company Name"
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
                  name="shipping_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Address"
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
                  name="shipping_contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Contact Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Contact Number"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="font-bold text-lg my-8 border-t pt-4">
              Billing Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="billing_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Company Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Company Name"
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
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Address"
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
                  name="billing_contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="app__formlabel_standard">
                        Contact Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="app__input_standard"
                          placeholder="Contact Number"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="mt-8">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
