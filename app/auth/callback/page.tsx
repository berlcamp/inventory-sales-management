'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      // Wait for session to update properly
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/auth/unverified'
        return
      }

      const userEmail = session.user.email

      // ✅ Check if user exists in DB
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (error) {
        await supabase.auth.signOut()
        console.error('Error fetching user:', error)
        // window.location.href = '/auth/unverified'
        return
      }

      if (!existingUser) {
        await supabase.auth.signOut()
        window.location.href = '/auth/unverified'
      } else {
        window.location.href = '/'
      }
    }

    checkUser()

    // ✅ Ensure session updates correctly
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          checkUser()
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

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
          <h1 className="text-base font-bold mb-8 text-nowrap">
            We are verifying your account, please wait...
          </h1>
        </div>
      </div>
    </div>
  )
}
