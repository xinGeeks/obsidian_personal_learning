import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

export function SummaryPage() {
  const { quiz, evaluations } = useStore()
  const navigate = useNavigate()

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">学习完成</h1>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalQ}</p>
            <p className="text-xs text-gray-500">题目数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{Math.round(avgScore)}%</p>
            <p className="text-xs text-gray-500">正确率</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{correctCount}</p>
            <p className="text-xs text-gray-500">答对数</p>
          </div>
        </div>

        {Object.keys(blindSpotFreq).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">知识盲区分布</h2>
            <div className="space-y-2">
              {Object.entries(blindSpotFreq)
                .sort(([, a], [, b]) => b - a)
                .map(([concept, count]) => (
                  <div key={concept} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-gray-700">{concept}</span>
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                      {count} 次
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">逐题回顾</h2>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const ev = evaluations[i]
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    ev
                      ? ev.correct
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Q{i + 1}.</span> {q.stem}
                  </p>
                  {ev && (
                    <p className="text-xs mt-1 text-gray-500">
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
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          返回仪表盘
        </button>
      </main>
    </div>
  )
}
