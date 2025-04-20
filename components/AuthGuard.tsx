'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) {
        window.location.href = '/login'
      }

      setLoading(false)
    }

    initAuth()

    // Listen for session changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          window.location.href = '/login'
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  if (loading) return <div className="text-center mt-16 p-6">Loading...</div>

  return <>{children}</>
}
