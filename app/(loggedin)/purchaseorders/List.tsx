'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { ProductLogsModal } from '@/components/ProductLogsModal'
import { Badge } from '@/components/ui/badge'
import { checkPDC } from '@/lib/helpers'
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
  ListChecks,
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
import { PartialDeliverModal } from './PartialDeliverModal'
import PrintModal from './PrintModal'
import { ViewProductsModal } from './ViewProductsModal'

// Always update this on other pages
type ItemType = PurchaseOrder
const table = 'purchase_orders'

export const List = ({}) => {
  const dispatch = useAppDispatch()
  const list = useSelector((state: RootState) => state.list.value)
  const user = useSelector((state: RootState) => state.user.user)
  const [saving, setSaving] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalPaymentOpen, setModalPaymentOpen] = useState(false)
  const [modalViewProductsOpen, setModalViewProductsOpen] = useState(false)
  const [modalMarkCompleteOpen, setModalMarkCompleteOpen] = useState(false)
  const [modalPartialDeliverOpen, setModalPartialDeliverOpen] = useState(false)
  const [modalMarkApproveOpen, setModalMarkApproveOpen] = useState(false)
  const [modalLogsOpen, setModalLogsOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

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

  const handleLogs = (item: ItemType) => {
    setSelectedItem(item)
    setModalLogsOpen(true)
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
  const handlePartiallyDelivered = (item: ItemType) => {
    setSelectedItem(item)
    setModalPartialDeliverOpen(true)
  }
  const handleMarkApproveConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setModalMarkApproveOpen(true)
  }

  const handleMarkComplete = async () => {
    if (!selectedItem) return
    if (saving) return

    setSaving(true)

    const { id: purchaseOrderId, order_items: products } = selectedItem

    // 1. Mark PO as delivered
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status: 'delivered' })
      .eq('id', purchaseOrderId)

    if (updateError) {
      toast.error('Failed to mark as delivered.')
      return
    }

    // 2. Update order_items: set delivered += to_deliver, to_deliver = 0
    for (const item of products) {
      const newlyDelivered = item.to_deliver ?? 0
      const newDeliveredTotal = (item.delivered ?? 0) + newlyDelivered

      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .update({
          delivered: newDeliveredTotal,
          to_deliver: 0
        })
        .eq('id', item.id)

      if (itemError) {
        toast.error(`Failed to update item ${item.product_id}`)
        return
      }
    }

    // 3. Insert product stock records
    const stockEntries = products.map((item) => ({
      product_id: item.product_id,
      cost: item.cost,
      selling_price: item.price,
      quantity: item.to_deliver ?? 0,
      remaining_quantity: item.to_deliver ?? 0,
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_order_id: purchaseOrderId
    }))

    const filteredEntries = stockEntries.filter((item) => item.quantity > 0)

    if (filteredEntries.length > 0) {
      const { error: stockError } = await supabase
        .from('product_stocks')
        .insert(filteredEntries)

      if (stockError) {
        toast.error('Failed to update product stocks.')
        return
      }
    }

    // 4. Insert log
    await supabase.from('product_change_logs').insert({
      po_id: purchaseOrderId,
      user_id: user?.system_user_id,
      user_name: user?.name,
      message: `Marked all items as delivered`
    })

    // 5. Notify and update Redux
    toast.success('Purchase Order marked as delivered and stocks updated!')

    dispatch(
      updateList({
        ...selectedItem,
        status: 'delivered',
        id: purchaseOrderId,
        order_items: products.map((item) => ({
          ...item,
          delivered: (item.delivered ?? 0) + (item.to_deliver ?? 0),
          to_deliver: 0
        }))
      })
    )

    setSaving(false)
    setModalMarkCompleteOpen(false)
  }

  const handleMarkApprove = async () => {
    if (!selectedItem) return

    await supabase
      .from('purchase_orders')
      .update({ status: 'approved' })
      .eq('id', selectedItem.id)

    toast.success('Purchased Order updated successfully!')

    // Update Redux state
    dispatch(
      updateList({
        ...selectedItem,
        status: 'approved',
        id: selectedItem.id
      })
    )
    setModalMarkApproveOpen(false)
  }

  const openPrint = async (item: ItemType) => {
    setSelectedItem(item)
    setIsPrintModalOpen(true)
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
            <th className="app__th">P.O. Number</th>
            <th className="app__th">Supplier</th>
            <th className="app__th">Total Amount</th>
            <th className="app__th">P.O. Status</th>
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
                        {(item.status === 'approved' ||
                          item.status === 'delivered') && (
                          <>
                            <MenuItem>
                              <div
                                onClick={() => openPrint(item)}
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
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div className="font-bold">{item.po_number}</div>
                <div className="text-xs text-gray-500">
                  {item.date && !isNaN(new Date(item.date).getTime())
                    ? format(new Date(item.date), 'MMMM dd, yyyy')
                    : 'Invalid date'}
                </div>
                <div className="mt-2 space-x-2">
                  {(item.status === 'approved' ||
                    item.status === 'delivered') && (
                    <>
                      <span
                        className="text-xs text-blue-800 cursor-pointer font-bold"
                        onClick={() => openPrint(item)}
                      >
                        Print P.O.
                      </span>
                      <span>|</span>
                    </>
                  )}
                  <span
                    className="text-xs text-blue-800 cursor-pointer font-bold"
                    onClick={() => handleViewProducts(item)}
                  >
                    View Products
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
                  {/* Badge + Dropdown for DRAFT */}
                  {item.status === 'draft' &&
                  user?.user_metadata?.sffo_role === 'admin' ? (
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button as="div">
                        <Badge className="flex items-center space-x-1 cursor-pointer">
                          <span>{item.status}</span>
                          <ChevronDown className="h-4 w-4" />
                        </Badge>
                      </Menu.Button>
                      <Transition as={Fragment}>
                        <MenuItems className="app__dropdown_items_left">
                          <div className="py-1">
                            <MenuItem>
                              <div
                                onClick={() =>
                                  handleMarkApproveConfirmation(item)
                                }
                                className="app__dropdown_item"
                              >
                                <CheckSquare className="w-4 h-4" />
                                <span>Mark as Approved</span>
                              </div>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  ) : item.status === 'draft' ? (
                    <Badge>{item.status}</Badge>
                  ) : null}

                  {/* Badge + Dropdown for APPROVED */}
                  {(item.status === 'approved' ||
                    item.status === 'partially delivered') &&
                  user?.user_metadata?.sffo_role === 'admin' ? (
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button as="div">
                        <Badge
                          variant="orange"
                          className="flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{item.status}</span>
                          <ChevronDown className="h-4 w-4" />
                        </Badge>
                      </Menu.Button>
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
                                <span>Mark all as Delivered</span>
                              </div>
                            </MenuItem>
                            <MenuItem>
                              <div
                                onClick={() => handlePartiallyDelivered(item)}
                                className="app__dropdown_item hidden"
                              >
                                <ListChecks className="w-4 h-4" />
                                <span>Partial Delivery Checklist</span>
                              </div>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  ) : item.status === 'approved' ? (
                    <Badge variant="orange">{item.status}</Badge>
                  ) : null}

                  {/* Delivered badge (no dropdown) */}
                  {item.status === 'delivered' && (
                    <Badge variant="green">{item.status}</Badge>
                  )}
                </div>
              </td>

              <td className="app__td">
                {item.status !== 'draft' && (
                  <div className="flex space-x-1">
                    {user?.user_metadata?.sffo_role === 'admin' ? (
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <Menu.Button as="div">
                          <Badge
                            variant={
                              item.payment_status === 'paid'
                                ? 'green'
                                : item.payment_status === 'partial'
                                ? 'orange'
                                : undefined
                            }
                            className="flex items-center space-x-1 cursor-pointer"
                          >
                            <span>
                              {item.payment_status === 'partial'
                                ? 'Partially Paid'
                                : item.payment_status}
                            </span>

                            <ChevronDown className="h-4 w-4" />
                          </Badge>
                        </Menu.Button>

                        <Transition as={Fragment}>
                          <MenuItems className="app__dropdown_items_left">
                            <div className="py-1">
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
                    ) : (
                      <Badge
                        variant={
                          item.payment_status === 'paid'
                            ? 'green'
                            : item.payment_status === 'partial'
                            ? 'orange'
                            : undefined
                        }
                      >
                        {item.payment_status}
                      </Badge>
                    )}
                    {item.payments && checkPDC(item.payments) && (
                      <Badge variant="orange">PDC</Badge>
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
        isOpen={modalMarkApproveOpen}
        onClose={() => setModalMarkApproveOpen(false)}
        onConfirm={handleMarkApprove}
        message="By marking as approve, you can no longer edit the product items. Are you sure you want to mark this as approved?"
      />
      <ConfirmationModal
        isOpen={modalMarkCompleteOpen}
        onClose={() => setModalMarkCompleteOpen(false)}
        onConfirm={handleMarkComplete}
        message="By marking as delivered, the purchased products will automatically be added to product stocks. Are you sure you want to mark this as delivered?"
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
      {selectedItem && modalPartialDeliverOpen && (
        <PartialDeliverModal
          isOpen={modalPartialDeliverOpen}
          editData={selectedItem}
          onClose={() => setModalPartialDeliverOpen(false)}
        />
      )}
      {selectedItem && (
        <ProductLogsModal
          isOpen={modalLogsOpen}
          POId={selectedItem.id}
          onClose={() => setModalLogsOpen(false)}
        />
      )}

      {selectedItem && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          editData={selectedItem}
        />
      )}
    </div>
  )
}
