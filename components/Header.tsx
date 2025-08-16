// components/Header.tsx
import { getSupabaseClient } from '@/lib/supabase/server'
import CompanySwitcher from './CompanySwitcher' // ✅ import switcher
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
    <header className="fixed px-2 top-0 z-40 w-full bg-gray-700 dark:bg-gray-800 flex items-center shadow-md h-14">
      <div className="flex w-full items-center text-gray-300 space-x-4">
        <div className="flex-1">
          <div className="hidden lg:block text-lg font-medium px-4 space-x-2">
            <span>Sales & Inventory Tracker</span>
          </div>
        </div>

        <div className="flex items-center text-gray-300 space-x-4">
          {/* ✅ Company Switcher goes here */}
          <CompanySwitcher />

          {/* Display the user's name */}
          <span>{`Hello, ${userData?.name}`}</span>

          {/* Theme toggle (light/dark mode) */}
          <ThemeToggle />

          {/* Logout button */}
          <form action="/auth/signout" method="post">
            <Button
              variant="outline"
              className="bg-gray-700"
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
