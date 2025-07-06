'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import Php from '@/components/Php'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem } from '@/store/listSlice'
import { ProductStock, RootState } from '@/types' // Import the RootState type
import { format } from 'date-fns'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { MissingModal } from './MissingModal'
import { PriceModal } from './PriceModal'

// Always update this on other pages
type ItemType = ProductStock

export const StocksList = () => {
  const dispatch = useAppDispatch()

  const list = useSelector((state: RootState) => state.stocksList.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)
  const [modalMissingOpen, setModalMissingOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

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

  const totalQuantity = list.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  )
  const totalRemaining = list.reduce(
    (sum, item) => sum + (item.remaining_quantity ?? 0),
    0
  )

  return (
    <div className="overflow-x-none pb-20">
      <div className="mt-4 text-right">
        Total Available Stocks:&nbsp;
        <span className="font-bold">
          {totalRemaining.toLocaleString()} out of{' '}
          {totalQuantity.toLocaleString()}
        </span>
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th">PO Number</th>
            <th className="app__th">Purchase Date</th>
            <th className="app__th">Total Quantity</th>
            <th className="app__th">Purchase Cost</th>
            <th className="app__th">Selling Price</th>
            <th className="app__th">Remaining Quantity</th>
            <th className="app__th">Missing</th>
            <th className="app__th"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <tr key={item.id} className="app__tr">
              <td className="app__td text-nowrap">
                {item.purchase_order?.po_number}
              </td>
              <td className="app__td">
                {item.purchase_date &&
                !isNaN(new Date(item.purchase_date).getTime())
                  ? format(new Date(item.purchase_date), 'MMMM dd, yyyy')
                  : 'Invalid date'}
              </td>
              <td className="app__td">{item.quantity}</td>
              <td className="app__td">
                <Php />{' '}
                {item.cost?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="app__td">
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
              <td className="app__td">
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
                    onClick={() => handleAddMissing(item)}
                    className="cursor-pointer"
                  >
                    <span className="text-blue-800 text-nowrap">
                      Add Missing
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
    </div>
  )
}
