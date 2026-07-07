import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  switch (profile?.role) {
    case 'admin':
    case 'coach':
      redirect('/coach')
    case 'parent':
      redirect('/parent')
    case 'player':
      redirect('/player')
    default:
      redirect('/login')
  }
}
