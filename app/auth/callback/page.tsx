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
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-purple-900 to-emerald-500 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg space-y-6">
        We are verifying your account, please wait...
      </div>
    </div>
  )
}
