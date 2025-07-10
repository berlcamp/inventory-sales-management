import { getSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('POST request from:', req.url)
  const supabase = await getSupabaseClient()

  // Check if a user's logged in
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  return NextResponse.redirect('https://ac23.ph', { status: 302 })
}
