'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { CustomerOrdersModal } from '@/components/CustomerOrdersModal'
import { supabase } from '@/lib/supabase/client'
import { useAppDispatch } from '@/store/hook'
import { deleteItem } from '@/store/listSlice'
import { Customer, RootState } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { ChevronDown, PencilIcon, TrashIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { AddModal } from './AddModal'

// Always update this on other pages
type ItemType = Customer
const table = 'customers'

export const List = ({}) => {
  const dispatch = useAppDispatch()
  const list = useSelector((state: RootState) => state.list.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalCustomerOpen, setModalCustomerOpen] = useState(false)

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

  const handleCustomerOrder = (item: ItemType) => {
    setSelectedItem(item)
    setModalCustomerOpen(true)
  }

  // Delete Supplier
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        if (error.code === '23503') {
          toast.error(
            `This customer cannot be deleted as has a referenced record.`
          )
        }
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
            <th className="app__th">Name</th>
            <th className="app__th">Contact</th>
            <th className="app__th">Address</th>
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
                <div className="font-medium">{item.name}</div>
                <div className="mt-2 space-x-2">
                  <span
                    className="text-xs text-blue-800 cursor-pointer font-medium"
                    onClick={() => handleCustomerOrder(item)}
                  >
                    View Order Transactions
                  </span>
                </div>
              </td>
              <td className="app__td">{item.contact_number}</td>
              <td className="app__td">{item.address}</td>
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
      <AddModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      {selectedItem && (
        <CustomerOrdersModal
          isOpen={modalCustomerOpen}
          customerId={selectedItem.id ?? 0}
          name={selectedItem.name ?? ''}
          onClose={() => setModalCustomerOpen(false)}
        />
      )}
    </div>
  )
}
