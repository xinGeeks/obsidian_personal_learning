import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export function SummaryPage() {
  const { quiz, evaluations } = useStore()
  const navigate = useNavigate()

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
        >
          返回仪表盘
        </button>
      </div>
    )
  }

  const questions = quiz.questions
  const totalQ = questions.length
  const totalScore = Object.values(evaluations).reduce((s, e) => s + e.score, 0)
  const avgScore = totalQ > 0 ? (totalScore / totalQ) * 100 : 0
  const correctCount = Object.values(evaluations).filter((e) => e.correct).length
  const allBlindSpots = Object.values(evaluations)
    .flatMap((e) => e.diagnostic.blind_spots)
    .map((s) => s.concept)

  const blindSpotFreq = allBlindSpots.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">学习完成</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{totalQ}</p>
          <p className="text-xs text-text-secondary mt-0.5">题目数</p>
        </div>
        <div className="bg-bg-card border border-border-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green">{Math.round(avgScore)}%</p>
          <p className="text-xs text-text-secondary mt-0.5">正确率</p>
        </div>
        <div className="bg-bg-card border border-border-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{correctCount}</p>
          <p className="text-xs text-text-secondary mt-0.5">答对数</p>
        </div>
      </div>

      {Object.keys(blindSpotFreq).length > 0 && (
        <div className="bg-bg-card border border-border-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">知识盲区分布</h2>
          <div className="space-y-2">
            {Object.entries(blindSpotFreq)
              .sort(([, a], [, b]) => b - a)
              .map(([concept, count]) => (
                <div key={concept} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-text-primary">{concept}</span>
                  <span className="text-xs px-2 py-0.5 bg-red/10 text-red rounded">
                    {count} 次
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-bg-card border border-border-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-3">逐题回顾</h2>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const ev = evaluations[i]
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  ev
                    ? ev.correct
                      ? 'border-green/20 bg-green/10'
                      : 'border-red/20 bg-red/10'
                    : 'border-border-card bg-bg-hover/30'
                }`}
              >
                <p className="text-sm text-text-primary">
                  <span className="font-medium">Q{i + 1}.</span> {q.stem}
                </p>
                {ev && (
                  <p className="text-xs mt-1 text-text-secondary">
                    {ev.correct ? '正确' : `得分 ${Math.round(ev.score * 100)}%`} — {ev.explanation.slice(0, 80)}...
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
      >
        返回仪表盘
      </button>
    </div>
  )
}
