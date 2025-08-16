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
      // ✅ Get companyId from localStorage
      const companyId = localStorage.getItem('company_id') || '1'

      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) {
        window.location.href = '/login'
      } else {
        const { data: systemUser, error: userError } = await supabase
          .from('users')
          .select()
          .eq('email', user.email)
          .eq('is_active', true)
          .single()

        if (userError || !systemUser) {
          console.error('System user not found or inactive:', userError)
          await supabase.auth.signOut()
          router.replace('/auth/unverified')
          setLoading(false)
          return
        }

        dispatch(
          setUser({
            ...user,
            system_user_id: systemUser.id,
            name: systemUser.name,
            company_id: companyId
          })
        )
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
