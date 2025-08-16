'use client'

import { useEffect, useState } from 'react'

export default function CompanySwitcher() {
  const [companyId, setCompanyId] = useState<string>('1')
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('company_id') || '1'
    setCompanyId(saved)
  }, [])

  const handleSwitch = (id: string) => {
    setIsSwitching(true) // ✅ show overlay
    setCompanyId(id)
    localStorage.setItem('company_id', id)

    // Give the overlay a moment to render before reload
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  return (
    <>
      {/* Switcher UI */}
      <div className="flex items-center space-x-2 bg-gray-600 rounded-full p-1">
        <button
          onClick={() => handleSwitch('1')}
          disabled={isSwitching}
          className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
            companyId === '1'
              ? 'bg-blue-500 text-white font-semibold shadow'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          HARDWARE
        </button>
        <button
          onClick={() => handleSwitch('2')}
          disabled={isSwitching}
          className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
            companyId === '2'
              ? 'bg-green-500 text-white font-semibold shadow'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          CEMENT
        </button>
      </div>

      {/* Blocking overlay */}
      {isSwitching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg">
            <p className="text-gray-700 dark:text-gray-200 font-medium">
              Switching company, please wait...
            </p>
          </div>
        </div>
      )}
    </>
  )
}
