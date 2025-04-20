// components/FilterComponent.tsx
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
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Customer } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  payment_status: z.string().optional(),
  customer_id: z.coerce.number().optional()
})

type FormType = z.infer<typeof FormSchema>

export const Filter = ({
  setFilterFrom,
  setFilterTo,
  setFilterPaymentStatus,
  setFilterCustomer
}: {
  setFilterFrom: (from: string) => void
  setFilterTo: (to: string) => void
  setFilterPaymentStatus: (status: string) => void
  setFilterCustomer: (cus: string) => void
}) => {
  // Category dropdown
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[] | null>(null)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      from: undefined,
      to: undefined,
      payment_status: undefined,
      customer_id: undefined
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    console.log(data)
    setFilterFrom(data.from ?? '')
    setFilterTo(data.to ?? '')
    setFilterPaymentStatus(data.payment_status ?? '')
    setFilterCustomer(data.customer_id?.toString() ?? '')
  }

  const handleReset = () => {
    setFilterFrom('')
    setFilterTo('')
    setFilterPaymentStatus('')
    setFilterCustomer('')
    form.reset({
      from: undefined,
      to: undefined,
      payment_status: '',
      customer_id: undefined
    })
  }

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      setCustomers(data)
    }

    fetchData()
  }, [])

  return (
    <div className="mt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="app__formlabel_standard">
                    From
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="app__input_standard"
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="app__formlabel_standard">To</FormLabel>
                  <FormControl>
                    <Input
                      className="app__input_standard"
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
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
                            'w-full justify-between hover:bg-white',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? customers?.find(
                                (c) =>
                                  c.id.toString() === field.value?.toString()
                              )?.name
                            : 'Select Customer'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search customer..." />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup>
                            {customers?.map((c) => (
                              <CommandItem
                                value={c.name}
                                key={c.id}
                                onSelect={(selectedName) => {
                                  const selectedCategory = customers.find(
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
                                    c.id.toString() === field.value?.toString()
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="app__formlabel_standard">
                    Payment Status
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value} // <- this ensures the selected value updates dynamically
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Payment Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-start space-x-2 mt-4">
            <Button type="submit">Submit Filter</Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
