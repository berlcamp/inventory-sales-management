import AdminDashboard from '@/components/Dashboard'
import { getSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await getSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="relative h-screen w-screen">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/bg.png')"
          }}
        ></div>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black opacity-60"></div>

        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="p-10 rounded-xl text-white text-center max-w-xl w-full mx-4">
            <h1 className="text-5xl md:text-5xl font-bold mb-8 text-nowrap">
              Sales & Inventory Tracker
            </h1>
            <div className="flex justify-center gap-6">
              <Link
                href="https://hardware.ac23.ph/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg font-bold text-2xl text-nowrap"
              >
                Login to Hardware
              </Link>
              <Link
                href="https://cement.ac23.ph/login"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-lg font-bold text-2xl text-nowrap"
              >
                Login to Cement
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminDashboard />
    </div>
  )
}
