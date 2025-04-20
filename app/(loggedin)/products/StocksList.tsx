'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem } from '@/store/listSlice'
import { Product, ProductStock, RootState } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { format } from 'date-fns'
import { ChevronDown, PencilIcon, TrashIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useSelector } from 'react-redux'
import { AddStockModal } from './AddStockModal'

// Always update this on other pages
type ItemType = ProductStock

export const StocksList = ({ product }: { product: Product }) => {
  const dispatch = useAppDispatch()

  const list = useSelector((state: RootState) => state.stocksList.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
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
        <Button onClick={() => setModalAddOpen(true)} className="ml-auto">
          Add Stock
        </Button>
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Purchase Date</th>
            <th className="app__th">Total Quantity</th>
            <th className="app__th">Purchase Cost</th>
            <th className="app__th">Selling Price</th>
            <th className="app__th">Remaining Quantity</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <tr key={item.id} className="app__tr">
              <td className="w-6 pl-4 app__td">
                <Menu as="div" className="app__menu_container">
                  <div>
                    <MenuButton className="app__dropdown_btn">
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    </MenuButton>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="app__dropdown_items">
                      <div className="py-1">
                        <MenuItem>
                          <div
                            onClick={() => handleEdit(item)}
                            className="app__dropdown_item"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit</span>
                          </div>
                        </MenuItem>
                        <MenuItem>
                          <div
                            onClick={() => handleDeleteConfirmation(item)}
                            className="app__dropdown_item"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </div>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
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

      <AddStockModal
        productId={product.id}
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
    </div>
  )
}
