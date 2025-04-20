// app/loggedin/layout.tsx (Server Component)
import { getSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return children
}
