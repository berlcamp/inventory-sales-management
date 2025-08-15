'use client'

import AdminDashboard from '@/components/Dashboard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSession, setIsSession] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) console.warn('Auth error:', error.message)
      if (data.user) {
        setIsSession(true)
      }
      setIsLoading(false)
    }

    checkSession()
  }, [router])

  if (isLoading) {
    return <LoadingSkeleton />
  } else {
    if (!isSession) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-start pt-10 bg-white px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Logo (optional replace with your own) */}
            <div className="flex justify-center">
              <Image
                src="/bg.png"
                alt="Asenso Logo"
                className="rounded-xl"
                width={420}
                height={420}
                priority
              />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Sales & Inventory Tracker
            </h1>
            <p className="text-sm text-gray-600">
              To get started, choose system to sign in
            </p>

            <Link href="https://cement.ac23.ph/login">
              <button
                disabled={isLoading}
                className="cursor-pointer w-full space-x-2 border border-gray-300 rounded-md py-2 px-4 flex items-center justify-center text-gray-800 bg-white hover:bg-gray-100 transition disabled:opacity-60"
              >
                {/* <Image
                  src="/icons8-google-100.svg"
                  alt="Google"
                  width={20}
                  height={20}
                /> */}
                <span>Login to</span>
                <span className="font-bold">Cement</span>
              </button>
            </Link>

            {/* Divider */}
            <div className="flex items-center gap-4 mt-4">
              <hr className="flex-grow border-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <hr className="flex-grow border-gray-200" />
            </div>

            <Link href="https://hardware.ac23.ph/login">
              <button
                disabled={isLoading}
                className="cursor-pointer w-full space-x-2 border border-gray-300 rounded-md py-2 px-4 flex items-center justify-center text-gray-800 bg-white hover:bg-gray-100 transition disabled:opacity-60"
              >
                {/* <Image
                  src="/icons8-google-100.svg"
                  alt="Google"
                  width={20}
                  height={20}
                /> */}
                <span>Login to</span>
                <span className="font-bold">Hardware</span>
              </button>
            </Link>
          </div>
        </main>
      )
    } else {
      return (
        <div>
          <AdminDashboard />
        </div>
      )
    }
  }
}
