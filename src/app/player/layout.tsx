import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'player') redirect('/login')

  return (
    <div className="min-h-screen">
      <Sidebar role="player" userName={profile.full_name}/>
      <MobileNav role="player"/>
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">{children}</main>
    </div>
  )
}
