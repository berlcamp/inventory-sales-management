'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import Php from '@/components/Php'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem } from '@/store/listSlice'
import { addList } from '@/store/stocksSlice'
import { ProductStock, RootState } from '@/types' // Import the RootState type
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { EditStockModal } from './EditStockModal'
import { MissingModal } from './MissingModal'
import { PriceModal } from './PriceModal'

// Always update this on other pages
type ItemType = ProductStock

export const StocksList = ({ categoryId }: { categoryId: number }) => {
  const dispatch = useAppDispatch()

  const list = useSelector((state: RootState) => state.stocksList.value)

  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [editStockOpen, setEditStockOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)
  const [modalMissingOpen, setModalMissingOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  const handleEditStock = (item: ItemType) => {
    setSelectedItem(item)
    setEditStockOpen(true)
  }
  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }

  const handleLogs = (item: ItemType) => {
    setSelectedItem(item)
    setModalLogsOpen(true)
  }

  const handleAddMissing = (item: ItemType) => {
    setSelectedItem(item)
    setModalMissingOpen(true)
  }

  // Delete Supplier
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from('product_stocks')
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting supplier:', error.message)
      } else {
        // delete item to Redux
        dispatch(deleteItem(selectedItem))
        setIsModalOpen(false)
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_stocks')
        .select(
          `
      *,
      product:product_id!inner (
        id,
        name,
        category_id,
        unit
      ),
      purchase_order:purchase_order_id (
        po_number,
        date
      )
    `,
          { count: 'exact' }
        )
        .eq('product.category_id', categoryId)

      if (error) {
        console.error(error)
        setLoading(false)
      } else {
        // Sort client-side by purchase_order.date (safe, non-deprecated)
        const sorted = data
          .filter((item) => item.product)
          .sort((a, b) => {
            const da = new Date(a.purchase_order?.date || 0).getTime()
            const db = new Date(b.purchase_order?.date || 0).getTime()
            return db - da // descending order (latest first)
          })

        dispatch(addList(sorted))
        setLoading(false)
      }
    }

    if (categoryId) fetchData()
  }, [categoryId, dispatch])

  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th">Product</th>
            <th className="app__th">Purchase Date</th>
            <th className="app__th">Total Quantity</th>
            <th className="app__th">Purchase Cost</th>
            <th className="app__th">Selling Price</th>
            <th className="app__th">Remaining Quantity</th>
            <th className="app__th">Missing/Damage</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <tr key={item.id} className="app__tr">
              <td className="app__td space-y-2">
                <div>{item.product?.name}</div>
                <div className="text-xs">
                  PO: {item.purchase_order?.po_number}
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    onClick={() => handleEdit(item)}
                    className="cursor-pointer"
                  >
                    <span className="text-blue-800 text-nowrap">
                      Update Price
                    </span>
                  </div>
                  <div>|</div>
                  <div
                    onClick={() => handleEditStock(item)}
                    className="cursor-pointer"
                  >
                    <span className="text-blue-800 text-nowrap">
                      Update Remaining Stocks
                    </span>
                  </div>
                  <div>|</div>
                  <div
                    onClick={() => handleAddMissing(item)}
                    className="cursor-pointer"
                  >
                    <span className="text-blue-800 text-nowrap">
                      Add Missing/Damage
                    </span>
                  </div>
                  <div>|</div>
                  <div
                    onClick={() => handleLogs(item)}
                    className="cursor-pointer"
                  >
                    <span className="text-blue-800">Logs</span>
                  </div>
                </div>
              </td>
              <td className="app__td text-nowrap">
                {item.purchase_order?.date &&
                !isNaN(new Date(item.purchase_order?.date).getTime())
                  ? format(new Date(item.purchase_order?.date), 'MMM dd, yyyy')
                  : 'Invalid date'}
              </td>
              <td className="app__td">{item.quantity}</td>
              <td className="app__td text-nowrap">
                <Php />{' '}
                {item.cost?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="app__td text-nowrap">
                <Php />{' '}
                {item.selling_price?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="app__td">
                <span className="font-bold text-lg">
                  {item.remaining_quantity}
                </span>
              </td>
              <td className="app__td">{item.missing}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this?"
      />

      <PriceModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      <EditStockModal
        isOpen={editStockOpen}
        editData={selectedItem}
        onClose={() => setEditStockOpen(false)}
      />
      {selectedItem && (
        <ProductLogsModal
          isOpen={modalLogsOpen}
          stockId={selectedItem.id}
          onClose={() => setModalLogsOpen(false)}
        />
      )}
      {selectedItem && (
        <MissingModal
          isOpen={modalMissingOpen}
          editData={selectedItem}
          onClose={() => setModalMissingOpen(false)}
        />
      )}
    </>
  )
}
