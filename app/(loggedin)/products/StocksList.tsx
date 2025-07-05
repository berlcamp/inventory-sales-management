'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem } from '@/store/listSlice'
import { ProductStock, RootState } from '@/types' // Import the RootState type
import { format } from 'date-fns'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { PriceModal } from './PriceModal'

// Always update this on other pages
type ItemType = ProductStock

export const StocksList = () => {
  const dispatch = useAppDispatch()

  const list = useSelector((state: RootState) => state.stocksList.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }

  const handleLogs = (item: ItemType) => {
    setSelectedItem(item)
    setModalLogsOpen(true)
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

  return (
    <div className="overflow-x-none pb-20">
      <div className="app__title">
        <h1 className="text-lg capitalize">Stocks</h1>
        {/* <Button onClick={() => setModalAddOpen(true)} className="ml-auto">
          Add Stock
        </Button> */}
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
              <td className="app__td">{item.cost}</td>
              <td className="app__td">{item.selling_price}</td>
              <td className="app__td">{item.remaining_quantity}</td>
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
    </div>
  )
}
