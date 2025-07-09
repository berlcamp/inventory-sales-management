'use client'

import LoadingSkeleton from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addList } from '@/store/listSlice' // Make sure this path is correct
import { useEffect, useState } from 'react'
import { AddModal } from './AddModal'
import { List } from './List'

export default function Page() {
  const [totalCount, setTotalCount] = useState(0)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const dispatch = useAppDispatch()

  // Fetch on page load
  useEffect(() => {
    dispatch(addList([])) // Reset the list first on page load

    const fetchData = async () => {
      setLoading(true)
      dispatch(addList([])) // Reset the list first on page load

      const { data, count, error } = await supabase
        .from('categories')
        .select('*,products(*,stocks:product_stocks(*))', {
          count: 'exact'
        })
        .order('name', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        const sortedData = data.map((category) => ({
          ...category,
          products: category.products.sort(
            (a: { name: string }, b: { name: string }) =>
              a.name.localeCompare(b.name)
          )
        }))

        // Update the list of suppliers in Redux store
        dispatch(addList(sortedData))
        setTotalCount(count || 0)
      }
      setLoading(false)
    }

    fetchData()
  }, [dispatch]) // Add `dispatch` to dependency array

  return (
    <div>
      <div className="app__title">
        <h1 className="text-3xl font-semibold">Products List</h1>
        <Button onClick={() => setModalAddOpen(true)} className="ml-auto">
          Add Product
        </Button>
      </div>

      {/* Pass Redux data to List Table */}
      <List />

      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton />}

      {totalCount === 0 && !loading && (
        <div className="mt-4 flex justify-center items-center space-x-2">
          No records found.
        </div>
      )}
      <AddModal isOpen={modalAddOpen} onClose={() => setModalAddOpen(false)} />
    </div>
  )
}
