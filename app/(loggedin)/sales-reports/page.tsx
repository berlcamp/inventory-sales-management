'use client'

import LoadingSkeleton from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { PER_PAGE } from '@/constants'
import { supabase } from '@/lib/supabase/client'
import { RootState } from '@/store'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { addList } from '@/store/listSlice' // Make sure this path is correct
import { useEffect, useState } from 'react'
import { Filter } from './Filter'
import { List } from './List'

export default function Page() {
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  const dispatch = useAppDispatch()

  const user = useAppSelector((state: RootState) => state.user.user)

  // Fetch on page load
  useEffect(() => {
    dispatch(addList([])) // Reset the list first on page load

    const fetchData = async () => {
      setLoading(true)
      let query = supabase
        .from('sales_orders')
        .select(
          '*,customer:customer_id(*),payments:sales_order_payments(*),order_items:sales_order_items(*,product_stock:product_stock_id(*,product:product_id(*)))',
          { count: 'exact' }
        )
        .eq('company_id', user?.company_id)
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
        .order('date', { ascending: false })
        .eq('status', 'completed')

      if (filterCustomer !== '') {
        query = query.eq('customer_id', filterCustomer)
      }

      if (filterFrom) {
        query = query.gte('date', filterFrom)
      }

      if (filterTo) {
        query = query.lte('date', filterTo)
      }

      if (filterPaymentStatus) {
        query = query.eq('payment_status', filterPaymentStatus)
      }

      const { data, count, error } = await query

      if (error) {
        console.error(error)
      } else {
        // Update the list of suppliers in Redux store
        dispatch(addList(data))
        setTotalCount(count || 0)
      }
      setLoading(false)
    }

    fetchData()
  }, [
    page,
    filterFrom,
    filterTo,
    filterPaymentStatus,
    filterCustomer,
    dispatch,
    user?.company_id
  ]) // Add `dispatch` to dependency array

  return (
    <div>
      <div className="app__title">
        <h1 className="text-3xl font-semibold">Sales Reports</h1>
      </div>

      <Filter
        setFilterCustomer={setFilterCustomer}
        setFilterPaymentStatus={setFilterPaymentStatus}
        setFilterFrom={setFilterFrom}
        setFilterTo={setFilterTo}
      />

      <div className="mt-4 py-2 text-xs border-t border-gray-200 text-gray-500">
        Showing {Math.min((page - 1) * PER_PAGE + 1, totalCount)} to{' '}
        {Math.min(page * PER_PAGE, totalCount)} of {totalCount} results
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
      {totalCount > 0 && (
        <div className="mt-4 flex justify-center items-center space-x-2">
          <Button
            size="xs"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <p>
            Page {page} of {Math.ceil(totalCount / PER_PAGE)}
          </p>
          <Button
            size="xs"
            onClick={() => setPage(page + 1)}
            disabled={page * PER_PAGE >= totalCount}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
