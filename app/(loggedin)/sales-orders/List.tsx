'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { CustomerOrdersModal } from '@/components/CustomerOrdersModal'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import { Badge } from '@/components/ui/badge'
import { checkPDC } from '@/lib/helpers'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem, updateList } from '@/store/listSlice'
import { RootState, SalesOrder } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { format } from 'date-fns'
import {
  Banknote,
  CheckSquare,
  ChevronDown,
  EyeIcon,
  OctagonPause,
  PencilIcon,
  PhilippinePeso,
  ShieldAlert,
  TrashIcon
} from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { AddModal } from './AddModal'
import { AddPaymentModal } from './AddPaymentModal'
// import PrintClaimSlip from './PrintClaimSlip'
import Php from '@/components/Php'
import ClaimSlipModal from './ClaimSlipModal'
import { ModifyModal } from './ModifyModal'
import { ViewProductsModal } from './ViewProductsModal'
import WithrawalSlipModal from './WithrawalSlipModal'

// Always update this on other pages
type ItemType = SalesOrder
const table = 'sales_orders'

export const List = ({}) => {
  const dispatch = useAppDispatch()
  const list = useSelector((state: RootState) => state.list.value)
  const user = useSelector((state: RootState) => state.user.user)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalModifyOpen, setModalModifyOpen] = useState(false)
  const [modalPaymentOpen, setModalPaymentOpen] = useState(false)
  const [modalViewProductsOpen, setModalViewProductsOpen] = useState(false)
  const [modalMarkCompleteOpen, setModalMarkCompleteOpen] = useState(false)
  const [modalMarkApproveOpen, setModalMarkApproveOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)
  const [modalCustomerOpen, setModalCustomerOpen] = useState(false)
  const [modalConfirmChangeStatus, setModalConfirmChangeStatus] =
    useState(false)

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [isPrintWSModalOpen, setIsPrintWSModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')

  const [saving, setSaving] = useState(false)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }
  const handleModify = (item: ItemType) => {
    setSelectedItem(item)
    setModalModifyOpen(true)
  }

  const handleReceivePayment = (item: ItemType) => {
    setSelectedItem(item)
    setModalPaymentOpen(true)
  }

  const handleLogs = (item: ItemType) => {
    setSelectedItem(item)
    setModalLogsOpen(true)
  }
  const handleCustomerOrder = (item: ItemType) => {
    setSelectedItem(item)
    setModalCustomerOpen(true)
  }

  const handleMarkCompleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setModalMarkCompleteOpen(true)
  }
  const handleMarkApprovedConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setModalMarkApproveOpen(true)
  }

  const handleChangeStatusConfirmation = (item: ItemType, status: string) => {
    setSelectedItem(item)
    setSelectedStatus(status)
    setModalConfirmChangeStatus(true)
  }

  const handleChangeStatus = async () => {
    if (!selectedItem) return

    setSaving(true)

    await supabase
      .from('sales_orders')
      .update({ payment_status: selectedStatus })
      .eq('id', selectedItem.id)

    toast.success('Sales Order updated successfully!')

    // Update logs
    await supabase.from('product_change_logs').insert({
      sales_order_id: selectedItem.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `updated status to ${selectedStatus}`
    })

    // Update Redux state
    dispatch(
      updateList({
        ...selectedItem,
        payment_status: selectedStatus,
        id: selectedItem.id
      })
    )
    setModalConfirmChangeStatus(false)
    setSaving(false)
  }

  const handleMarkComplete = async () => {
    if (!selectedItem) return

    setSaving(true)

    await supabase
      .from('sales_orders')
      .update({ status: 'completed' })
      .eq('id', selectedItem.id)

    toast.success('Sales Order updated successfully!')

    // Update logs
    await supabase.from('product_change_logs').insert({
      sales_order_id: selectedItem.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `updated status to Complete`
    })

    // Update Redux state
    dispatch(
      updateList({
        ...selectedItem,
        status: 'completed',
        id: selectedItem.id
      })
    )
    setModalMarkCompleteOpen(false)
    setSaving(false)
  }
  const handleMarkApprove = async () => {
    if (!selectedItem) return

    setSaving(true)

    const updatedData = selectedItem.order_items.map((order) => {
      const currentRemaining = order.product_stock?.remaining_quantity ?? 0

      const newRemaining = currentRemaining - order.quantity

      if (newRemaining < 0) {
        toast.error(
          `Not enough stock for product ${order.product_stock?.product?.name}, Please check your product stocks.`
        )
        throw new Error(
          `Insufficient stock for product_stock_id ${order.product_stock_id}`
        )
      }

      return {
        id: order.product_stock_id,
        remaining_quantity: newRemaining
      }
    })

    const { error } = await supabase.from('product_stocks').upsert(updatedData)

    if (error) {
      toast.error('Error updating stock')
      console.error(error)
      return
    }

    await supabase
      .from('sales_orders')
      .update({ status: 'approved' })
      .eq('id', selectedItem.id)

    toast.success('Sales Order updated successfully!')

    // Update logs
    await supabase.from('product_change_logs').insert({
      sales_order_id: selectedItem.id,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `updated status to Approved`
    })

    // Update Redux state
    dispatch(
      updateList({
        ...selectedItem,
        status: 'completed',
        id: selectedItem.id
      })
    )
    setModalMarkApproveOpen(false)
    setSaving(false)
  }

  const openClaimSlip = async (item: ItemType) => {
    setSelectedItem(item)
    setIsPrintModalOpen(true)
  }
  const openWithrawalSlip = async (item: ItemType) => {
    setSelectedItem(item)
    setIsPrintWSModalOpen(true)
  }

  const handleViewProducts = (item: ItemType) => {
    setSelectedItem(item)
    setModalViewProductsOpen(true)
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
      {saving && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold animate-pulse">
            Processing...
          </div>
        </div>
      )}
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">S.O. Number</th>
            <th className="app__th">Customer</th>
            <th className="app__th">Total Amount</th>
            <th className="app__th">Order Status</th>
            <th className="app__th">Payment Status</th>
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

                  <Transition as={Fragment}>
                    <MenuItems className="app__dropdown_items">
                      <div className="py-1">
                        {(item.status === 'reserved' ||
                          item.status === 'completed') && (
                          <>
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
                        {item.status === 'reserved' && (
                          <>
                            <MenuItem>
                              <div
                                onClick={() => handleEdit(item)}
                                className="app__dropdown_item"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span>Edit Details</span>
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
                        {(item.status === 'approved' ||
                          item.status === 'completed') && (
                          <MenuItem>
                            <div
                              onClick={() => handleModify(item)}
                              className="app__dropdown_item"
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Modify</span>
                            </div>
                          </MenuItem>
                        )}
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div className="font-bold">{item.so_number}</div>
                <div className="text-xs text-gray-500">
                  {item.date && !isNaN(new Date(item.date).getTime())
                    ? format(new Date(item.date), 'MMMM dd, yyyy')
                    : 'Invalid date'}
                </div>
                <div className="mt-2 space-x-2">
                  {(item.status === 'reserved' ||
                    item.status === 'completed') && (
                    <>
                      <span
                        className="text-xs text-blue-800 cursor-pointer font-bold"
                        onClick={() => openClaimSlip(item)}
                      >
                        Order Slip
                      </span>
                      <span>|</span>
                      <span
                        className="text-xs text-blue-800 cursor-pointer font-bold"
                        onClick={() => openWithrawalSlip(item)}
                      >
                        Withdrawal Slip
                      </span>
                      <span>|</span>
                    </>
                  )}
                  <span
                    className="text-xs text-blue-800 cursor-pointer font-bold"
                    onClick={() => handleViewProducts(item)}
                  >
                    Products
                  </span>
                  <span>|</span>
                  <span
                    className="text-xs text-blue-800 cursor-pointer font-medium"
                    onClick={() => handleLogs(item)}
                  >
                    Logs
                  </span>
                </div>
              </td>
              <td className="app__td">
                <div className="font-medium">
                  {item.customer?.name}{' '}
                  {/* <span className="text-xs">
                    [{item.customer?.company_id}-{item.customer?.id}]
                  </span> */}
                </div>
                <div className="text-xs text-gray-500">
                  {item.customer?.address}
                </div>
                <div className="mt-2 space-x-2">
                  <span
                    className="text-xs text-blue-800 cursor-pointer font-medium"
                    onClick={() => handleCustomerOrder(item)}
                  >
                    View Order Transactions
                  </span>
                </div>
              </td>
              <td className="app__td">
                <Php />{' '}
                {item.total_amount?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              {/* STATUS COLUMN */}
              <td className="app__td">
                <div className="flex space-x-1">
                  {item.status !== 'completed' &&
                  user?.user_metadata?.sffo_role === 'admin' ? (
                    <Menu as="div" className="relative">
                      <MenuButton
                        as={Badge}
                        className="flex items-center space-x-1 cursor-pointer"
                      >
                        <span>{item.status}</span>
                        <ChevronDown className="h-4 w-4" />
                      </MenuButton>

                      <Transition as={Fragment}>
                        <MenuItems className="app__dropdown_items_left">
                          <div className="py-1">
                            {item.status === 'reserved' && (
                              <MenuItem>
                                <div
                                  onClick={() =>
                                    handleMarkApprovedConfirmation(item)
                                  }
                                  className="app__dropdown_item"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  <span>Mark as Approved</span>
                                </div>
                              </MenuItem>
                            )}
                            {item.status === 'approved' && (
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
                            )}
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  ) : (
                    <>
                      {item.status === 'reserved' && (
                        <Badge>{item.status}</Badge>
                      )}
                      {item.status === 'approved' && (
                        <Badge variant="blue">{item.status}</Badge>
                      )}
                      {item.status === 'completed' && (
                        <Badge variant="green">{item.status}</Badge>
                      )}
                    </>
                  )}
                </div>
              </td>

              {/* PAYMENT STATUS COLUMN */}
              <td className="app__td">
                <div className="flex space-x-1">
                  <Menu as="div" className="relative">
                    <MenuButton
                      as={Badge}
                      className={`flex items-center space-x-1 cursor-pointer ${
                        item.payment_status === 'partial'
                          ? 'bg-orange-600 text-white'
                          : item.payment_status === 'Cheque'
                          ? 'bg-orange-600 text-white'
                          : item.payment_status === 'Hold'
                          ? 'bg-orange-600 text-white'
                          : item.payment_status === 'Deposited'
                          ? 'bg-green-600 text-white'
                          : ''
                      }`}
                    >
                      <span>
                        {item.payment_status === 'partial'
                          ? 'Partially Paid'
                          : item.payment_status}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </MenuButton>

                    <Transition as={Fragment}>
                      <MenuItems className="app__dropdown_items_left">
                        <div className="py-1">
                          <MenuItem>
                            <div
                              onClick={() =>
                                handleChangeStatusConfirmation(item, 'Cheque')
                              }
                              className="app__dropdown_item"
                            >
                              <Banknote className="w-4 h-4" />
                              <span>Mark as Cheque</span>
                            </div>
                          </MenuItem>
                          <MenuItem>
                            <div
                              onClick={() =>
                                handleChangeStatusConfirmation(item, 'Hold')
                              }
                              className="app__dropdown_item"
                            >
                              <OctagonPause className="w-4 h-4" />
                              <span>Mark as Hold</span>
                            </div>
                          </MenuItem>
                          <MenuItem>
                            <div
                              onClick={() =>
                                handleChangeStatusConfirmation(
                                  item,
                                  'Deposited'
                                )
                              }
                              className="app__dropdown_item"
                            >
                              <CheckSquare className="w-4 h-4" />
                              <span>Mark as Deposited</span>
                            </div>
                          </MenuItem>
                          <MenuItem>
                            <div
                              onClick={() =>
                                handleChangeStatusConfirmation(item, 'unpaid')
                              }
                              className="app__dropdown_item"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              <span>Mark as Unpaid</span>
                            </div>
                          </MenuItem>
                          <MenuItem>
                            <div
                              onClick={() => handleReceivePayment(item)}
                              className="app__dropdown_item"
                            >
                              <PhilippinePeso className="w-4 h-4" />
                              <span>Manage Payments</span>
                            </div>
                          </MenuItem>
                        </div>
                      </MenuItems>
                    </Transition>
                  </Menu>
                  {item.payments && checkPDC(item.payments) && (
                    <Badge variant="orange">PDC</Badge>
                  )}
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
      <ConfirmationModal
        isOpen={modalMarkCompleteOpen}
        onClose={() => setModalMarkCompleteOpen(false)}
        onConfirm={handleMarkComplete}
        message="Are you sure you want to mark this as complete?"
      />
      <ConfirmationModal
        isOpen={modalConfirmChangeStatus}
        onClose={() => setModalConfirmChangeStatus(false)}
        onConfirm={handleChangeStatus}
        message="Are you sure you want to change the status?"
      />
      <ConfirmationModal
        isOpen={modalMarkApproveOpen}
        onClose={() => setModalMarkApproveOpen(false)}
        onConfirm={handleMarkApprove}
        message="This will update the product stocks from the inventory and cannot be undone, are you sure you want to mark this as approved?"
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

      {selectedItem && (
        <ProductLogsModal
          isOpen={modalLogsOpen}
          salesOrderId={selectedItem.id}
          onClose={() => setModalLogsOpen(false)}
        />
      )}
      {selectedItem && (
        <ModifyModal
          isOpen={modalModifyOpen}
          editData={selectedItem}
          onClose={() => setModalModifyOpen(false)}
        />
      )}
      {selectedItem && (
        <CustomerOrdersModal
          isOpen={modalCustomerOpen}
          customerId={selectedItem.customer_id ?? 0}
          name={selectedItem.customer?.name ?? ''}
          onClose={() => setModalCustomerOpen(false)}
        />
      )}
      {selectedItem && (
        <ClaimSlipModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          editData={selectedItem}
        />
      )}
      {selectedItem && (
        <WithrawalSlipModal
          isOpen={isPrintWSModalOpen}
          onClose={() => setIsPrintWSModalOpen(false)}
          editData={selectedItem}
        />
      )}
    </div>
  )
}
