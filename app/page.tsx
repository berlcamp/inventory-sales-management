import AdminDashboard from '@/components/Dashboard'
import LoginBox from '@/components/LoginBox'
import { getSupabaseClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await getSupabaseClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return <LoginBox />
  }

  return (
    <div>
      <AdminDashboard />
    </div>
  )
}
