'use client'

import { supabase } from '@/lib/supabase/client'
import { setUser } from '@/store/userSlice'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const dispatch = useDispatch()

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) {
        window.location.href = '/login'
      } else {
        dispatch(setUser(user))
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
  }, [dispatch, router])

  if (loading) return <div className="text-center mt-16 p-6">Loading...</div>

  return <>{children}</>
}
