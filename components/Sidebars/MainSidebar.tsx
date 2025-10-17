'use client'

import { RootState } from '@/types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'

const MainSidebar = () => {
  const currentRoute = usePathname()

  const user = useSelector((state: RootState) => state.user.user)

  return (
    <>
      <ul className="pt-8 mt-4 space-y-2 border-gray-700">
        {/* Dashboard Section */}
        <li>
          <div className="flex items-center text-gray-500 space-x-1 px-2">
            <span className="font-semibold">Dashboard</span>
          </div>
        </li>
        <li>
          <Link
            href="/"
            className={`app__menu_link ${
              currentRoute === '/' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Overview</span>
          </Link>
        </li>

        {/* Products Section */}
        <li>
          <div className="flex items-center text-gray-500 space-x-1 px-2">
            <span className="font-semibold">Products</span>
          </div>
        </li>
        <li>
          <Link
            href="/products2"
            className={`app__menu_link ${
              currentRoute === '/products2' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Product List</span>
          </Link>
        </li>
        <li>
          <Link
            href="/categories"
            className={`app__menu_link ${
              currentRoute === '/categories' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Categories Settings
            </span>
          </Link>
        </li>

        {/* Sales Section */}
        <li>
          <div className="flex items-center text-gray-500 space-x-1 px-2">
            <span className="font-semibold">Sales</span>
          </div>
        </li>
        <li>
          <Link
            href="/sales-orders"
            className={`app__menu_link ${
              currentRoute === '/sales-orders' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Sales Orders</span>
          </Link>
        </li>
        <li>
          <Link
            href="/sales-reports"
            className={`app__menu_link ${
              currentRoute === '/sales-reports' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Sales Reports</span>
          </Link>
        </li>

        {/* Customers Section */}
        <li>
          <div className="flex items-center text-gray-500 space-x-1 px-2">
            <span className="font-semibold">Customers</span>
          </div>
        </li>
        <li>
          <Link
            href="/customers"
            className={`app__menu_link ${
              currentRoute === '/customers' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">Customer List</span>
          </Link>
        </li>

        {/* Suppliers Section */}
        <li>
          <div className="flex items-center text-gray-500 space-x-1 px-2">
            <span className="font-semibold">Purchase Orders</span>
          </div>
        </li>
        <li>
          <Link
            href="/purchaseorders"
            className={`app__menu_link ${
              currentRoute === '/purchaseorders' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Purchase Orders List
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/suppliers"
            className={`app__menu_link ${
              currentRoute === '/suppliers' ? 'app_menu_link_active' : ''
            }`}
          >
            <span className="flex-1 ml-3 whitespace-nowrap">
              Suppliers List
            </span>
          </Link>
        </li>

        {/* Settings Section */}
        {user?.user_metadata?.sffo_role === 'admin' && (
          <>
            <li>
              <div className="flex items-center text-gray-500 space-x-1 px-2">
                <span className="font-semibold">Settings</span>
              </div>
            </li>
            {/* <li>
              <Link
                href="/settings"
                className={`app__menu_link ${
                  currentRoute === '/settings' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  Address Settings
                </span>
              </Link>
            </li> */}
            <li>
              <Link
                href="/users"
                className={`app__menu_link ${
                  currentRoute === '/users' ? 'app_menu_link_active' : ''
                }`}
              >
                <span className="flex-1 ml-3 whitespace-nowrap">
                  System Users
                </span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </>
  )
}

export default MainSidebar
