'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem, updateList } from '@/store/listSlice'
import { PurchaseOrder, RootState } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { format } from 'date-fns'
import {
  CheckSquare,
  ChevronDown,
  EyeIcon,
  PencilIcon,
  PhilippinePeso,
  PrinterIcon,
  TrashIcon
} from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { AddModal } from './AddModal'
import { AddPaymentModal } from './AddPaymentModal'
import generatePurchaseOrderPDF from './PrintPo'
import { ViewProductsModal } from './ViewProductsModal'

// Always update this on other pages
type ItemType = PurchaseOrder
const table = 'purchase_orders'

export const List = ({}) => {
  const dispatch = useAppDispatch()
  const list = useSelector((state: RootState) => state.list.value)
  const user = useSelector((state: RootState) => state.user.user)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalPaymentOpen, setModalPaymentOpen] = useState(false)
  const [modalViewProductsOpen, setModalViewProductsOpen] = useState(false)
  const [modalMarkCompleteOpen, setModalMarkCompleteOpen] = useState(false)

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

  const handleViewProducts = (item: ItemType) => {
    setSelectedItem(item)
    setModalViewProductsOpen(true)
  }
  const handleReceivePayment = (item: ItemType) => {
    setSelectedItem(item)
    setModalPaymentOpen(true)
  }
  const handleMarkCompleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setModalMarkCompleteOpen(true)
  }

  const handleMarkComplete = async () => {
    if (!selectedItem) return

    await supabase
      .from('purchase_orders')
      .update({ status: 'completed' })
      .eq('id', selectedItem.id)

    toast.success('Purchased Order updated successfully!')

    // Update Redux state
    dispatch(
      updateList({
        ...selectedItem,
        status: 'completed',
        id: selectedItem.id
      })
    )
    setModalMarkCompleteOpen(false)
  }

  const handlePrintPurchaseOrder = (item: ItemType) => {
    generatePurchaseOrderPDF(item) // Pass the data you want to print
  }

  // Delete Supplier
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting supplier:', error.message)
      } else {
        toast.success('Successfully deleted!')

        // delete item to Redux
        dispatch(deleteItem(selectedItem))
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
            <th className="app__th">P.O. Number</th>
            <th className="app__th">Supplier</th>
            <th className="app__th">Total Amount</th>
            <th className="app__th">Status</th>
            <th className="app__th">Payment</th>
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
                        {item.status === 'completed' && (
                          <>
                            <MenuItem>
                              <div
                                onClick={() => handlePrintPurchaseOrder(item)}
                                className="app__dropdown_item"
                              >
                                <PrinterIcon className="w-4 h-4" />
                                <span>Print P.O.</span>
                              </div>
                            </MenuItem>
                            <MenuItem>
                              <div
                                onClick={() => handleViewProducts(item)}
                                className="app__dropdown_item"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>View Products</span>
                              </div>
                            </MenuItem>
                          </>
                        )}
                        {item.status === 'draft' && (
                          <>
                            <MenuItem>
                              <div
                                onClick={() => handleEdit(item)}
                                className="app__dropdown_item"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span>Edit P.O. Details</span>
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
                          </>
                        )}
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div>{item.po_number}</div>
                <div className="text-xs text-gray-500">
                  {item.date && !isNaN(new Date(item.date).getTime())
                    ? format(new Date(item.date), 'MMMM dd, yyyy')
                    : 'Invalid date'}
                </div>
              </td>
              <td className="app__td">
                <div>{item.supplier?.name}</div>
                <div className="text-xs text-gray-500">
                  {item.supplier?.address}
                </div>
              </td>
              <td className="app__td">
                ₱{' '}
                {item.total_amount?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="app__td">
                <div className="flex space-x-1">
                  <div>
                    {item.status === 'draft' && <Badge>{item.status}</Badge>}
                    {item.status === 'completed' && (
                      <Badge variant="green">{item.status}</Badge>
                    )}
                  </div>
                  {item.status === 'draft' &&
                    user?.user_metadata?.sffo_role === 'admin' && (
                      <Menu as="div" className="app__menu_container">
                        <div>
                          <MenuButton className="app__dropdown_btn">
                            <ChevronDown
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </MenuButton>
                        </div>

                        <Transition as={Fragment}>
                          <MenuItems className="app__dropdown_items_left">
                            <div className="py-1">
                              <MenuItem>
                                <div
                                  onClick={() =>
                                    handleMarkCompleteConfirmation(item)
                                  }
                                  className="app__dropdown_item"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  <span>Mark as Complete</span>
                                </div>
                              </MenuItem>
                            </div>
                          </MenuItems>
                        </Transition>
                      </Menu>
                    )}
                </div>
              </td>
              <td className="app__td">
                {item.status === 'completed' && (
                  <div className="flex space-x-1">
                    <div>
                      {item.payment_status === 'unpaid' && (
                        <Badge>{item.payment_status}</Badge>
                      )}
                      {item.payment_status === 'partial' && (
                        <Badge variant="orange">{item.payment_status}</Badge>
                      )}
                      {item.payment_status === 'paid' && (
                        <Badge variant="green">{item.payment_status}</Badge>
                      )}
                    </div>
                    {user?.user_metadata?.sffo_role === 'admin' && (
                      <Menu as="div" className="app__menu_container">
                        <div>
                          <MenuButton className="app__dropdown_btn">
                            <ChevronDown
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </MenuButton>
                        </div>

                        <Transition as={Fragment}>
                          <MenuItems className="app__dropdown_items_left">
                            <div className="py-1">
                              <MenuItem>
                                <div
                                  onClick={() => handleReceivePayment(item)}
                                  className="app__dropdown_item"
                                >
                                  <PhilippinePeso className="w-4 h-4" />
                                  <span>Payments</span>
                                </div>
                              </MenuItem>
                            </div>
                          </MenuItems>
                        </Transition>
                      </Menu>
                    )}
                  </div>
                )}
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
      <ConfirmationModal
        isOpen={modalMarkCompleteOpen}
        onClose={() => setModalMarkCompleteOpen(false)}
        onConfirm={handleMarkComplete}
        message="By marking as complete, you can no longer edit the product items, are you sure you want to mark this as complete?"
      />
      <AddModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      {selectedItem && modalPaymentOpen && (
        <AddPaymentModal
          isOpen={modalPaymentOpen}
          editData={selectedItem}
          onClose={() => setModalPaymentOpen(false)}
        />
      )}
      {selectedItem && modalViewProductsOpen && (
        <ViewProductsModal
          isOpen={modalViewProductsOpen}
          editData={selectedItem}
          onClose={() => setModalViewProductsOpen(false)}
        />
      )}
    </div>
  )
}
