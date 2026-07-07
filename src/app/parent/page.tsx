import { createClient } from '@/lib/supabase/server'
import { formatDate, categoryColor, paymentStatusColor, getCurrentMonth } from '@/lib/utils'
import PlayerCard from '@/components/cards/PlayerCard'
import Link from 'next/link'
import { CalendarDays, BarChart3, CreditCard, Megaphone, ChevronRight } from 'lucide-react'

export default async function ParentDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  // Find linked player via guardian
  const { data: guardian } = await supabase.from('guardians').select('*, player:players(*, stats:player_stats(*))').eq('profile_id', user!.id).single()
  const player = guardian?.player as any
  const stats = player?.stats?.sort((a: any, b: any) => b.assessed_month.localeCompare(a.assessed_month))[0] ?? null

  // Upcoming sessions for player's category
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .or(`category.eq.${player?.category},category.eq.All`)
    .order('date')
    .limit(3)

  // Announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .or(`target_category.eq.All,target_category.eq.${player?.category}`)
    .order('created_at', { ascending: false })
    .limit(3)

  // Attendance for current month
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('player_id', player?.id)

  const presentCount = attendance?.filter(a => a.status === 'present').length ?? 0
  const totalCount = attendance?.length ?? 0
  const attendanceRate = totalCount > 0 ? Math.round(100 * presentCount / totalCount) : 0

  // Payment
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('player_id', player?.id)
    .eq('month', getCurrentMonth())
    .single()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-teal-400 text-sm font-semibold">{greeting}</p>
        <h1 className="text-3xl font-black font-condensed text-white mt-1">
          {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-white/30 text-sm mt-1">{formatDate(new Date().toISOString())} · Parent Portal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player card */}
        <div className="flex flex-col items-center gap-4">
          {player ? (
            <>
              <PlayerCard player={player} stats={stats} showDownload/>
              <Link href="/parent/card" className="btn-secondary w-full text-center text-sm">
                View Full Card
              </Link>
            </>
          ) : (
            <div className="card p-8 text-center text-white/30 w-full">
              <CreditCard size={40} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No player linked to your account yet.</p>
              <p className="text-xs mt-2">Contact your coach to set up your account.</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats row */}
          {player && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 text-center">
                <div className="text-3xl font-black font-condensed text-teal-400">{attendanceRate}%</div>
                <div className="text-white/40 text-xs mt-1">Attendance Rate</div>
                <div className="text-white/20 text-xs">{presentCount}/{totalCount} sessions</div>
              </div>
              <div className="card p-4 text-center">
                <div className={`text-3xl font-black font-condensed ${payment?.status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                  {payment?.status === 'paid' ? '✓' : '!'}
                </div>
                <div className="text-white/40 text-xs mt-1">Fee Status</div>
                <div className={`badge mt-1 mx-auto inline-block ${paymentStatusColor(payment?.status ?? 'pending')}`}>
                  {payment?.status ?? 'pending'}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming sessions */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Upcoming Training</h2>
              <Link href="/parent/schedule" className="text-teal-400 text-xs hover:underline">View all</Link>
            </div>
            {!sessions?.length ? (
              <p className="text-white/30 text-sm text-center py-4">No upcoming sessions</p>
            ) : sessions?.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                {i === 0 && (
                  <span className="bg-teal-400 text-navy-900 text-[9px] font-black px-1.5 py-0.5 rounded absolute -translate-y-5 ml-10">NEXT</span>
                )}
                <div className="w-10 h-10 rounded-lg bg-teal-400/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-teal-400 font-bold text-[9px]">
                    {new Date(s.date).toLocaleDateString('en', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className="text-white font-black text-sm">{new Date(s.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-white/40 text-xs">{s.time_start.slice(0,5)} · {s.venue}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Announcements */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Club Announcements</h2>
            {!announcements?.length ? (
              <p className="text-white/30 text-sm text-center py-4">No announcements</p>
            ) : announcements?.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.is_urgent ? 'bg-red-400' : 'bg-teal-400'}`}/>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{a.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{a.body}</p>
                  <p className="text-white/25 text-xs mt-1">{formatDate(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
