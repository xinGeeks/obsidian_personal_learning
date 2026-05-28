import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RecommendationItem, SessionRecord } from '../lib/types'
import { fetchRecommendations, fetchHistory } from '../lib/api'
import { useStore } from '../lib/store'
import { CalendarHeatmap } from '../components/CalendarHeatmap'

function masteryLabel(m: number): string {
  if (m < 0.3) return '薄弱'
  if (m < 0.6) return '一般'
  return '熟练'
}

function masteryTextColor(m: number): string {
  if (m < 0.3) return 'text-red'
  if (m < 0.6) return 'text-yellow-400'
  return 'text-green'
}

export function Dashboard() {
  const navigate = useNavigate()
  const { quiz, phase, startReview } = useStore()
  const [recs, setRecs] = useState<RecommendationItem[]>([])
  const [recsMsg, setRecsMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [rc, sessions] = await Promise.all([
          fetchRecommendations(),
          fetchHistory({
            date_from: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          }).catch(() => [] as SessionRecord[]),
        ])
        setRecs(rc.items)
        setRecsMsg(rc.message || '')

        // Aggregate sessions by date for heatmap
        const dateCounts = new Map<string, number>()
        for (const s of sessions) {
          const d = s.started_at.slice(0, 10)
          dateCounts.set(d, (dateCounts.get(d) || 0) + 1)
        }
        setHeatmapData(
          Array.from(dateCounts.entries()).map(([date, count]) => ({ date, count }))
        )
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Navigate to quiz if one is active
  useEffect(() => {
    if (quiz && phase === 'quiz') {
      navigate('/quiz')
    }
  }, [quiz, phase, navigate])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {recs.length > 0
            ? `${recs.length} 篇笔记待复习`
            : '开始你的学习之旅'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red/10 border border-red/20 rounded-xl text-red text-sm">
          {error}
        </div>
      )}

      {/* Main grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column: Review Recommendations */}
        <section className="bg-bg-card border border-border-card rounded-xl p-5 hover:border-accent/15 transition-colors duration-200">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            今日推荐复习
          </h2>

          {recs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-secondary text-sm mb-4">
                {recsMsg || '当前没有需要复习的内容'}
              </p>
              <button
                onClick={() => navigate('/select')}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                选择笔记开始学习
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recs.map((item) => (
                <div
                  key={item.note_path}
                  className="bg-bg-hover/50 border border-border-card rounded-lg p-3.5 hover:border-accent/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-medium text-text-primary text-sm truncate flex-1">
                      {item.title}
                    </h3>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-current/10 ${masteryTextColor(item.mastery)}`}
                    >
                      {masteryLabel(item.mastery)} {Math.round(item.mastery * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-3">{item.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red">
                      逾期 {item.overdue_days} 天
                    </span>
                    <button
                      onClick={() => startReview(item.note_path)}
                      className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      开始复习
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right column: Calendar Heatmap */}
        <section className="bg-bg-card border border-border-card rounded-xl p-5 hover:border-accent/15 transition-colors duration-200">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            学习日历
          </h2>

          {heatmapData.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-text-secondary text-sm mb-1">暂无学习记录</p>
              <p className="text-text-secondary text-xs mb-4">完成首次答题后这里会显示学习热力图</p>
              <button
                onClick={() => navigate('/select')}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                开始学习
              </button>
            </div>
          ) : (
            <CalendarHeatmap data={heatmapData} />
          )}
        </section>
      </div>
    </div>
  )
}
