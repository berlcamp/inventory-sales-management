'use client'

import AdminDashboard from '@/components/Dashboard'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSession, setIsSession] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      setError(error.message)
    }
  }

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
    return (
      <div>
        <LoadingSkeleton />
      </div>
    )
  } else {
    if (!isSession) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-start bg-black px-4">
          <div className="w-full md:max-w-[800px] max-w-md space-y-6 h-screen text-center py-10 bg-white px-10">
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
              To get started, sign in with google
            </p>

            {error && <p>{error}</p>}

            <button
              onClick={handleGoogleLogin}
              className="w-full cursor-pointer  font-semibold space-x-2 border border-gray-300 rounded-md py-2 px-4 flex items-center justify-center text-gray-800 bg-white hover:bg-gray-100 transition disabled:opacity-60"
            >
              <Image
                src="/icons8-google-100.svg"
                alt="Google"
                width={20}
                height={20}
              />
              <span>Login with Google</span>
            </button>
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
