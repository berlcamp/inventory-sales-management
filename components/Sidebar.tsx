'use client'

import { MenuIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from './ui/button'

function Sidebar({ children }: { children: React.ReactNode }) {
  const [viewSidebar, setViewSidebar] = useState(false)

  const toggleSidebar = () => {
    setViewSidebar(!viewSidebar)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        className="fixed top-3 left-3 z-50 lg:hidden rounded-full bg-gray-800 text-white p-2"
        onClick={toggleSidebar}
        variant="ghost"
      >
        <MenuIcon className="w-6 h-6" />
      </Button>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`fixed inset-0 z-10 transition-opacity duration-300 ${
          viewSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'
        } lg:hidden`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 left-0 z-10 w-64 bg-gray-300 dark:bg-gray-700 transition-transform duration-300 transform ${
          viewSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:block`}
        aria-label="Sidebar"
      >
        <div className="h-full px-4 py-6 overflow-y-auto">{children}</div>
      </aside>
    </>
  )
}

export default Sidebar
