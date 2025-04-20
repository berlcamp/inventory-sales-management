'use client'

import { Badge } from '@/components/ui/badge'
import { RootState, SalesOrder } from '@/types' // Import the RootState type
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition
} from '@headlessui/react'
import { format } from 'date-fns'
import { ChevronDown, EyeIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useSelector } from 'react-redux'
import { ViewProductsModal } from './ViewProductsModal'

// Always update this on other pages
type ItemType = SalesOrder

export const List = ({}) => {
  const list = useSelector((state: RootState) => state.list.value)

  const [modalViewProductsOpen, setModalViewProductsOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  const handleViewProducts = (item: ItemType) => {
    setSelectedItem(item)
    setModalViewProductsOpen(true)
  }
  return (
    <div className="overflow-x-none">
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">S.O. Number</th>
            <th className="app__th">Customer</th>
            <th className="app__th">Total Amount</th>
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
                        <MenuItem>
                          <div
                            onClick={() => handleViewProducts(item)}
                            className="app__dropdown_item"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>View Products</span>
                          </div>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div>{item.so_number}</div>
                <div className="text-xs text-gray-500">
                  {item.date && !isNaN(new Date(item.date).getTime())
                    ? format(new Date(item.date), 'MMMM dd, yyyy')
                    : 'Invalid date'}
                </div>
              </td>
              <td className="app__td">
                <div>{item.customer?.name}</div>
                <div className="text-xs text-gray-500">
                  {item.customer?.address}
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
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
