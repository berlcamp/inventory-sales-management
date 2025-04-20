'use client'

import { Button } from '@/components/ui/button'
import { PER_PAGE } from '@/constants'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addList } from '@/store/listSlice' // Make sure this path is correct
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AddModal } from './AddModal'
import { Filter } from './Filter'
import { List } from './List'

export default function Page() {
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const dispatch = useAppDispatch()

  // Fetch on page load
  useEffect(() => {
    dispatch(addList([])) // Reset the list first on page load

    const fetchData = async () => {
      const { data, count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .ilike('name', `%${filter}%`)
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
        .order('id', { ascending: false })

      if (error) {
        console.error(error)
        if (error.code === '23503') {
          toast.error(
            'Category cannot be deleted as it is associated to one of your products'
          )
        }
      } else {
        // Update the list of suppliers in Redux store
        dispatch(addList(data))
        setTotalCount(count || 0)
      }
    }

    fetchData()
  }, [page, filter, dispatch]) // Add `dispatch` to dependency array

  return (
    <div>
      <div className="app__title">
        <h1 className="text-3xl font-semibold">Product Categories</h1>
        <Button onClick={() => setModalAddOpen(true)} className="ml-auto">
          Add Category
        </Button>
      </div>

      <Filter filter={filter} setFilter={setFilter} />

      <div className="mt-4 py-2 text-xs border-t border-gray-200 text-gray-500">
        Showing {Math.min((page - 1) * PER_PAGE + 1, totalCount)} to{' '}
        {Math.min(page * PER_PAGE, totalCount)} of {totalCount} results
      </div>

      {/* Pass Redux data to List Table */}
      <List />

      <div className="mt-4 flex justify-center items-center space-x-2">
        <Button
          size="xs"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <p>Page {page}</p>
        <Button
          size="xs"
          onClick={() => setPage(page + 1)}
          disabled={page * PER_PAGE >= totalCount}
        >
          Next
        </Button>
      </div>
      <AddModal isOpen={modalAddOpen} onClose={() => setModalAddOpen(false)} />
    </div>
  )
}
