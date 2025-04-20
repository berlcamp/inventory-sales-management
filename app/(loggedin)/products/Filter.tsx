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
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Category } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface FormType {
  keyword?: string
  category_id?: number
}

const FormSchema = z.object({
  keyword: z.string().optional(),
  category_id: z.coerce.number().optional()
})

export const Filter = ({
  setFilter,
  setFilterCategory
}: {
  setFilter: (filter: string) => void
  setFilterCategory: (cat: string) => void
}) => {
  // Category dropdown
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[] | null>(null)

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      keyword: undefined,
      category_id: undefined
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    console.log(data)
    setFilter(data.keyword ?? '')
    setFilterCategory(data.category_id?.toString() ?? '')
  }

  const handleReset = () => {
    setFilter('')
    setFilterCategory('')
    form.reset({
      keyword: undefined,
      category_id: undefined
    })
  }

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      setCategories(data)
    }

    console.log('categories fetched from filter')
    fetchData()
  }, [])

  return (
    <div className="mt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="app__formlabel_standard">
                    Search by Product Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="app__input_standard"
                      placeholder="Search Product Name"
                      type="text"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
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
                                  cat.id.toString() === field.value?.toString()
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
                          <CommandEmpty>No category found.</CommandEmpty>
                          <CommandGroup>
                            {categories?.map((cat) => (
                              <CommandItem
                                value={cat.name}
                                key={cat.id}
                                onSelect={(selectedName) => {
                                  const selectedCategory = categories.find(
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
