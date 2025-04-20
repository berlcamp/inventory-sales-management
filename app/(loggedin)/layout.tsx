// app/loggedin/layout.tsx (Server Component)
import { getSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'POS',
  description: 'POS by BTC'
}

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
