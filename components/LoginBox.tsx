'use client'

import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { useState } from 'react'

export default function LoginBox({ message }: { message?: string }) {
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-10 justify-start bg-white px-4">
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
        {process.env.NEXT_PUBLIC_COMPANY_ID === '1' && (
          <h1 className="text-2xl font-bold text-blue-900">HARDWARE</h1>
        )}
        {process.env.NEXT_PUBLIC_COMPANY_ID === '2' && (
          <h1 className="text-2xl font-semibold text-gray-900">CEMENT</h1>
        )}
        <p className="text-sm text-gray-600">
          To get started, sign in using google
        </p>

        {error && <p>{error}</p>}
        {message && <p>{message}</p>}

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
}
