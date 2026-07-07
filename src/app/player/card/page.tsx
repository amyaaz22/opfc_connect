import { createClient } from '@/lib/supabase/server'
import PlayerCard from '@/components/cards/PlayerCard'
import { formatDate, getAge } from '@/lib/utils'
import { redirect } from 'next/navigation'

export default async function PlayerCardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: player } = await supabase
    .from('players')
    .select('*, stats:player_stats(*)')
    .eq('profile_id', user.id)
    .single()

  if (!player) {
    return (
      <div className="p-8 text-center text-white/30">
        <p>No player profile linked. Contact your coach.</p>
      </div>
    )
  }

  const allStats = (player as any).stats?.sort((a: any, b: any) =>
    b.assessed_month.localeCompare(a.assessed_month)) ?? []
  const latestStats = allStats[0] ?? null

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="page-title mb-6">My Card</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex justify-center">
          <PlayerCard player={player as any} stats={latestStats} showDownload/>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="section-title mb-4">My Info</h2>
            <div className="space-y-3">
              {[
                ['Name', player.full_name],
                ['Date of Birth', formatDate(player.date_of_birth)],
                ['Age', `${getAge(player.date_of_birth)} years`],
                ['Category', player.category],
                ['Position', player.position],
                ['Player Code', player.player_code],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-white/40 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {latestStats && (
            <div className="card p-5">
              <h2 className="section-title mb-4">Latest Ratings — {latestStats.assessed_month}</h2>
              <div className="space-y-3">
                {(['pac','sho','pas','dri','def','phy'] as const).map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/40 w-8 uppercase">{key}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${latestStats[key] >= 80 ? 'bg-teal-400' : 'bg-blue-400'}`}
                        style={{ width: `${latestStats[key]}%` }}/>
                    </div>
                    <span className="text-sm font-bold text-white w-6 text-right">{latestStats[key]}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/40 text-sm">Overall Rating</span>
                  <span className="text-3xl font-black font-condensed text-teal-400">{latestStats.ovr}</span>
                </div>
              </div>
              {latestStats.coach_notes && (
                <div className="mt-4 p-3 bg-teal-400/5 border border-teal-400/10 rounded-xl">
                  <p className="text-white/40 text-xs font-bold mb-1">COACH NOTES</p>
                  <p className="text-white/70 text-sm">{latestStats.coach_notes}</p>
                </div>
              )}
            </div>
          )}
          {allStats.length > 1 && (
            <div className="card p-5">
              <h2 className="section-title mb-3">Progress</h2>
              <div className="space-y-2">
                {allStats.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-sm">{s.assessed_month}</span>
                    <span className="text-teal-400 font-black font-condensed text-xl">{s.ovr}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
