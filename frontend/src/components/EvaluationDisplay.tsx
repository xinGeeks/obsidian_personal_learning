import type { Evaluation } from '../lib/types'

interface Props {
  evaluation: Evaluation
  onNext: () => void
}

export function EvaluationDisplay({ evaluation, onNext }: Props) {
  const { correct, score, explanation, correct_answer, diagnostic } = evaluation

  return (
    <div>
      <div
        className={`p-4 rounded-lg mb-4 ${
          correct ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
        }`}
      >
        <p className={`text-lg font-semibold ${correct ? 'text-green-700' : 'text-amber-700'}`}>
          {correct ? '回答正确' : score >= 0.4 ? '部分正确' : '回答错误'}
          <span className="text-sm font-normal ml-2">得分: {Math.round(score * 100)}%</span>
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 mb-4">
        <p className="text-sm font-medium text-gray-500 mb-1">AI 评判</p>
        <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
      </div>

      {correct_answer && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm font-medium text-blue-700 mb-1">正确答案</p>
          <p className="text-blue-800">{correct_answer}</p>
        </div>
      )}

      {diagnostic.blind_spots.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm font-semibold text-red-700 mb-2">知识盲区</p>
          {diagnostic.blind_spots.map((spot, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-sm font-medium text-red-800">{spot.concept}</p>
              <p className="text-sm text-red-600">{spot.gap_description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {spot.suggested_review_notes.map((note) => (
                  <span
                    key={note}
                    className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded"
                  >
                    回看: {note}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">{diagnostic.summary}</p>

      <button
        onClick={onNext}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
      >
        下一题
      </button>
    </div>
  )
}
