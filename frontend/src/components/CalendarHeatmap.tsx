import { useMemo, useState } from 'react'

interface HeatmapDay {
  date: string
  count: number
  dayOfWeek: number
  weekIndex: number
  dayOfMonth: number
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-bg-hover/30'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-green/20'
  if (ratio < 0.5) return 'bg-green/40'
  if (ratio < 0.75) return 'bg-green/65'
  return 'bg-green/90'
}

const DAY_LABELS = ['', '一', '', '三', '', '五', '']

function monthLabel(x: number, weeks: HeatmapDay[][]): string | null {
  if (weeks[x].length === 0) return null
  const d = weeks[x][0].dayOfMonth
  if (d <= 7) {
    const date = new Date(weeks[x][0].date)
    return `${date.getMonth() + 1}月`
  }
  return null
}

export function CalendarHeatmap({ data, year }: { data: { date: string; count: number }[]; year?: number }) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const displayYear = year ?? new Date().getFullYear()

  const { weeks, maxCount } = useMemo(() => {
    const countMap = new Map<string, number>()
    for (const d of data) {
      countMap.set(d.date.slice(0, 10), (countMap.get(d.date.slice(0, 10)) || 0) + d.count)
    }

    const start = new Date(displayYear, 0, 1)
    const end = new Date(displayYear, 11, 31)

    const days: HeatmapDay[] = []
    const cursor = new Date(start)

    while (cursor.getDay() !== 1) {
      cursor.setDate(cursor.getDate() - 1)
    }

    cursor.setDate(cursor.getDate() - cursor.getDay() + 1)

    let weekIdx = 0
    while (cursor <= end || days.length % 7 !== 0) {
      const dateStr = cursor.toISOString().slice(0, 10)
      const inRange = cursor >= start && cursor <= end
      days.push({
        date: dateStr,
        count: inRange ? (countMap.get(dateStr) || 0) : -1,
        dayOfWeek: cursor.getDay(),
        weekIndex: weekIdx,
        dayOfMonth: cursor.getDate(),
      })
      cursor.setDate(cursor.getDate() + 1)
      if (cursor.getDay() === 1) weekIdx++
    }

    // Group into weeks (columns)
    const ws: HeatmapDay[][] = []
    for (const d of days) {
      if (d.dayOfWeek === 1 || ws.length === 0) {
        ws.push([])
      }
      ws[ws.length - 1].push(d)
    }

    const max = Math.max(1, ...days.map((d) => d.count).filter((c) => c > 0))

    return { weeks: ws, maxCount: max }
  }, [data, displayYear])

  const colCount = weeks.length

  return (
    <div className="relative overflow-x-auto">
      {/* Month labels row */}
      <div className="flex mb-0.5 ml-7">
        {weeks.map((_w, i) => (
          <div key={i} className="text-[10px] text-text-secondary leading-none" style={{ width: 14, marginRight: 2 }}>
            {monthLabel(i, weeks)}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Day-of-week labels */}
        <div className="flex flex-col mr-1.5 pt-0.5" style={{ gap: 2 }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-[10px] text-text-secondary leading-none" style={{ width: 24, height: 14, lineHeight: '14px' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="flex"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 14px)`,
            gridTemplateRows: 'repeat(7, 14px)',
            gap: 2,
          }}
        >
          {weeks.flatMap((week) =>
            week.map((day) => (
              <div
                key={day.date}
                className={`rounded-sm ${day.count === -1 ? 'bg-transparent' : getIntensity(day.count, maxCount)}`}
                style={{ width: 14, height: 14 }}
                onMouseEnter={(e) => {
                  if (day.count === -1) return
                  const rect = (e.target as HTMLElement).getBoundingClientRect()
                  setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top - 8 })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-bg-card border border-border-card text-xs text-text-primary shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="text-text-secondary">{tooltip.date}</div>
          <div>{tooltip.count} 次学习</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 ml-7">
        <span className="text-[10px] text-text-secondary">少</span>
        <div className="w-3 h-3 rounded-sm bg-bg-hover/30" />
        <div className="w-3 h-3 rounded-sm bg-green/20" />
        <div className="w-3 h-3 rounded-sm bg-green/40" />
        <div className="w-3 h-3 rounded-sm bg-green/65" />
        <div className="w-3 h-3 rounded-sm bg-green/90" />
        <span className="text-[10px] text-text-secondary">多</span>
      </div>
    </div>
  )
}
