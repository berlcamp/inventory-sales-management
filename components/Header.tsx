// components/Header.tsx
import { getSupabaseClient } from '@/lib/supabase/server'
import Image from 'next/image'
import CompanySwitcher from './CompanySwitcher'
import ThemeToggle from './ThemeToggle'
import { Button } from './ui/button'

export async function Header() {
  const supabase = await getSupabaseClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('email', user?.email)
    .single()

  return (
    <header className="fixed top-0 z-40 w-full bg-gray-700 dark:bg-gray-800 shadow-md h-14 flex items-center px-3">
      <div className="flex w-full items-center justify-between text-gray-300">
        {/* Left side — logo and title */}
        <div className="flex items-center space-x-3">
          <Image
            src="/cgm-logo.png"
            alt="Caragon General Merchandise Logo"
            width={36}
            height={36}
            className="rounded-md hidden lg:block"
            priority
          />
          <span className="hidden lg:block text-lg font-semibold tracking-wide text-white">
            CARAGON GENERAL MERCHANDISE OPC
          </span>
        </div>

        {/* Right side — controls */}
        <div className="flex items-center space-x-4 text-gray-300">
          <CompanySwitcher />

          {/* Display the user's name */}
          <span className="hidden sm:block">{`Hello, ${
            userData?.name || 'User'
          }`}</span>

          <ThemeToggle />

          {/* Logout button */}
          <form action="/auth/signout" method="post">
            <Button
              variant="outline"
              className="bg-gray-700 hover:bg-gray-600 text-gray-100"
              size="sm"
              type="submit"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
