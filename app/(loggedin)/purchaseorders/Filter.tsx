// components/FilterComponent.tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface FormType {
  keyword?: string
}

const FormSchema = z.object({
  keyword: z.string().optional(),
  category_id: z.coerce.number().optional()
})

export const Filter = ({
  setFilter
}: {
  setFilter: (filter: string) => void
}) => {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      keyword: undefined
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    setFilter(data.keyword ?? '')
  }

  const handleReset = () => {
    setFilter('')
    form.reset({
      keyword: undefined
    })
  }

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
                    Search by PO Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="app__input_standard"
                      placeholder="PO Number"
                      type="text"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
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
