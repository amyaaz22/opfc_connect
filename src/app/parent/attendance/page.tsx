import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import AttendanceChart from '@/components/charts/AttendanceChart'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default async function ParentAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: guardian } = await supabase
    .from('guardians')
    .select('player_id')
    .eq('profile_id', user.id)
    .single()

  if (!guardian?.player_id) {
    return <div className="p-8 text-center text-white/30">No player linked to your account.</div>
  }

  const { data: records } = await supabase
    .from('attendance')
    .select('*, session:training_sessions(title, date, session_type, category)')
    .eq('player_id', guardian.player_id)
    .order('scanned_at', { ascending: false })

  const present = records?.filter(r => r.status === 'present').length ?? 0
  const absent = records?.filter(r => r.status === 'absent').length ?? 0
  const late = records?.filter(r => r.status === 'late').length ?? 0
  const total = records?.length ?? 0
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  // Build monthly chart data
  const byMonth: Record<string, { present: number; total: number }> = {}
  records?.forEach(r => {
    const month = (r.session as any)?.date?.slice(0, 7) ?? 'Unknown'
    if (!byMonth[month]) byMonth[month] = { present: 0, total: 0 }
    byMonth[month].total++
    if (r.status === 'present') byMonth[month].present++
  })
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, { present, total }]) => ({
      label: new Date(`${month}-01`).toLocaleDateString('en', { month: 'short' }),
      present, total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    }))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="page-title mb-6">Attendance</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Present', value: present, color: 'text-green-400' },
          { label: 'Absent', value: absent, color: 'text-red-400' },
          { label: 'Rate', value: `${rate}%`, color: rate >= 80 ? 'text-teal-400' : rate >= 60 ? 'text-amber-400' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-2xl font-black font-condensed ${color}`}>{value}</div>
            <div className="text-white/40 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="section-title mb-4">Monthly Attendance Rate</h2>
          <AttendanceChart data={chartData}/>
        </div>
      )}

      {/* Record list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-white font-bold text-sm">Attendance History</h2>
        </div>
        {!records?.length ? (
          <div className="p-8 text-center text-white/30 text-sm">No attendance records yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                {r.status === 'present'
                  ? <CheckCircle size={16} className="text-green-400 flex-shrink-0"/>
                  : r.status === 'late'
                  ? <Clock size={16} className="text-amber-400 flex-shrink-0"/>
                  : <XCircle size={16} className="text-red-400/40 flex-shrink-0"/>
                }
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{(r.session as any)?.title ?? 'Session'}</p>
                  <p className="text-white/30 text-xs">{formatDate((r.session as any)?.date)}</p>
                </div>
                <span className={`badge text-xs
                  ${r.status === 'present' ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : r.status === 'late' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/10 text-red-400/50 border-red-500/10'}`}>
                  {r.status}
                </span>
                {r.scanned_at && (
                  <span className="text-white/20 text-xs hidden sm:block">
                    {new Date(r.scanned_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
