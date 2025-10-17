'use client'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import {
  countAllStocks,
  countAvailableStocks,
  countMissingStocks
} from '@/lib/helpers'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { updateList } from '@/store/listSlice'
import { Category, Product, RootState } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { ChevronDown, LayersIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { AddModal } from './AddModal'
import { SalesModal } from './SalesModal'
import { StocksModal } from './StocksModal'

// Always update this on other pages
type ItemType = Product
const table = 'products'

export const List = ({}) => {
  const dispatch = useAppDispatch()
  const list = useSelector((state: RootState) => state.list.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalStockOpen, setModalStockOpen] = useState(false)
  const [modalSalesOpen, setModalSalesOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null
  )

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }

  const handleManageStocks = (item: ItemType) => {
    setSelectedItem(item)
    setModalStockOpen(true)
  }

  const handleLogs = (item: ItemType) => {
    setSelectedItem(item)
    setModalLogsOpen(true)
  }

  const handleViewSales = (item: ItemType) => {
    setSelectedItem(item)
    setModalSalesOpen(true)
  }

  // Delete Supplier
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error(error)
        if (error.code === '23503') {
          toast.error(
            'Product cannot be deleted as it is associated to one of your sales or purchase orders.'
          )
        }
      } else {
        toast.success('Successfully deleted!')

        // delete item to Redux ss
        // Get the category the product belongs to
        const category = list.find(
          (c: Category) => c.id === selectedItem.category_id
        )

        if (category) {
          dispatch(
            updateList({
              ...category,
              products: category.products.filter(
                (p: Product) => p.id !== selectedItem.id
              )
            })
          )
        }
        setIsModalOpen(false)
      }
    }
  }

  return (
    <div className="overflow-x-none">
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Name</th>
            <th className="app__th">Unit</th>
            <th className="app__th">Category</th>
            <th className="app__th">Available Stocks</th>
          </tr>
        </thead>
        <tbody>
          {list.map((category: Category) => (
            <Fragment key={category.id}>
              <tr
                className="app__tr cursor-pointer"
                onClick={() =>
                  setExpandedCategoryId((prev) =>
                    prev === category.id ? null : category.id
                  )
                }
              >
                <td className="w-12 pl-4 app__td">&nbsp;</td>
                <td className="app__td">
                  <div className="font-bold cursor-pointer">
                    {category.name}
                  </div>
                  <div className="mt-2 space-x-2">
                    <span className="text-xs text-blue-800 cursor-pointer font-medium">
                      {expandedCategoryId === category.id
                        ? 'Hide Products'
                        : 'View Products'}
                    </span>
                  </div>
                </td>
                <td className="app__td"></td>
                <td className="app__td"></td>
                <td className="app__td"></td>
              </tr>

              {expandedCategoryId === category.id &&
                category.products?.map((item: ItemType) => (
                  <tr key={item.id} className="app__tr">
                    <td className="w-12 app__td border-l-2 border-gray-200 space-y-2">
                      <Menu as="div" className="app__menu_container">
                        <div>
                          <MenuButton className="app__dropdown_btn">
                            <ChevronDown
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
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
                                  onClick={() => handleManageStocks(item)}
                                  className="app__dropdown_item"
                                >
                                  <LayersIcon className="w-4 h-4" />
                                  <span>Manage Stocks</span>
                                </div>
                              </MenuItem>
                              <MenuItem>
                                <div
                                  onClick={() => handleEdit(item)}
                                  className="app__dropdown_item"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                  <span>Edit Product Details</span>
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
                      <div className="font-medium">{item.name}</div>
                      <div className="mt-2 space-x-2">
                        <span
                          className="text-xs text-blue-800 cursor-pointer font-medium"
                          onClick={() => handleViewSales(item)}
                        >
                          View Sales
                        </span>
                        <span>|</span>
                        <span
                          className="text-xs text-blue-800 cursor-pointer font-medium"
                          onClick={() => handleManageStocks(item)}
                        >
                          Manage Stocks & Prices
                        </span>
                        <span>|</span>
                        <span
                          className="text-xs text-blue-800 cursor-pointer font-medium"
                          onClick={() => handleLogs(item)}
                        >
                          View Logs
                        </span>
                      </div>
                    </td>
                    <td className="app__td">{item.unit}</td>
                    <td className="app__td">{item.category?.name}</td>
                    <td className="app__td">
                      {item.stocks && (
                        <div className="flex space-x-4 justify-between pr-10">
                          <div>
                            <span className="font-bold text-lg">
                              {countAvailableStocks(item.stocks)}
                            </span>{' '}
                            <span>out of </span>
                            <span>{countAllStocks(item.stocks)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">
                              [Missing:{' '}
                              <span>{countMissingStocks(item.stocks)}</span>]
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this?"
      />
      <AddModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      {selectedItem && (
        <StocksModal
          isOpen={modalStockOpen}
          editData={selectedItem}
          onClose={() => setModalStockOpen(false)}
        />
      )}
      {selectedItem && (
        <SalesModal
          isOpen={modalSalesOpen}
          productId={selectedItem.id}
          onClose={() => setModalSalesOpen(false)}
        />
      )}

      {selectedItem && (
        <ProductLogsModal
          isOpen={modalLogsOpen}
          productId={selectedItem.id}
          onClose={() => setModalLogsOpen(false)}
        />
      )}
    </div>
  )
}
