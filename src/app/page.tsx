'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  useEffect(() => {
    async function redirect() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      switch (profile?.role) {
        case 'admin':
        case 'coach':
          window.location.href = '/coach'; break
        case 'parent':
          window.location.href = '/parent'; break
        case 'player':
          window.location.href = '/player'; break
        default:
          window.location.href = '/login'
      }
    }
    redirect()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-gradient">
      <div className="flex items-center gap-3 text-white/40">
        <div className="animate-spin w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full"/>
        Loading…
      </div>
    </div>
  )
}
