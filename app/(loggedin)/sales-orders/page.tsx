'use client'

import LoadingSkeleton from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { PER_PAGE } from '@/constants'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { addList } from '@/store/listSlice' // Make sure this path is correct
import { SalesOrderPayment } from '@/types'
import { useEffect, useState } from 'react'
import { AddModal } from './AddModal'
import { Filter } from './Filter'
import { List } from './List'

export default function Page() {
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filter, setFilter] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  const dispatch = useAppDispatch()

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
        .ilike('po_number', `%${filter}%`)
        .order('id', { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

      if (filterCustomer !== '') {
        query = query.eq('customer_id', filterCustomer)
      }

      if (filterPaymentStatus === 'PDC') {
        query = query.not('payments', 'is', null) // only orders with payments
      } else if (filterPaymentStatus) {
        query = query.eq('payment_status', filterPaymentStatus)
      }

      const { data, count, error } = await query

      if (error) {
        console.error(error)
      } else {
        if (filterPaymentStatus === 'PDC') {
          const filteredData = data?.filter((order) =>
            order.payments?.some((p: SalesOrderPayment) => p.type === 'PDC')
          )
          dispatch(addList(filteredData))
        } else {
          dispatch(addList(data))
        }

        setTotalCount(count || 0)
      }
      setLoading(false)
    }

    fetchData()
  }, [page, filter, filterPaymentStatus, filterCustomer, dispatch]) // Add `dispatch` to dependency array

  return (
    <div>
      <div className="app__title">
        <h1 className="text-3xl font-semibold">Sales Orders</h1>
        <Button onClick={() => setModalAddOpen(true)} className="ml-auto">
          Create Sales Order
        </Button>
      </div>

      <Filter
        setFilterCustomer={setFilterCustomer}
        setFilter={setFilter}
        setFilterPaymentStatus={setFilterPaymentStatus}
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
          <p>Page {page}</p>
          <Button
            size="xs"
            onClick={() => setPage(page + 1)}
            disabled={page * PER_PAGE >= totalCount}
          >
            Next
          </Button>
        </div>
      )}
      <AddModal isOpen={modalAddOpen} onClose={() => setModalAddOpen(false)} />
    </div>
  )
}
