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
          correct ? 'bg-green/10 border border-green/20' : 'bg-yellow-400/10 border border-yellow-400/20'
        }`}
      >
        <p className={`text-lg font-semibold ${correct ? 'text-green' : 'text-yellow-400'}`}>
          {correct ? '回答正确' : score >= 0.4 ? '部分正确' : '回答错误'}
          <span className="text-sm font-normal ml-2 text-text-secondary">得分: {Math.round(score * 100)}%</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-text-secondary mb-1">AI 评判</p>
        <p className="text-text-primary whitespace-pre-wrap">{explanation}</p>
      </div>

      {correct_answer && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg mb-4">
          <p className="text-sm font-medium text-accent mb-1">正确答案</p>
          <p className="text-text-primary">{correct_answer}</p>
        </div>
      )}

      {diagnostic.blind_spots.length > 0 && (
        <div className="p-4 bg-red/10 border border-red/20 rounded-lg mb-4">
          <p className="text-sm font-semibold text-red mb-2">知识盲区</p>
          {diagnostic.blind_spots.map((spot, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-sm font-medium text-text-primary">{spot.concept}</p>
              <p className="text-sm text-text-secondary">{spot.gap_description}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {spot.suggested_review_notes.map((note) => (
                  <span
                    key={note}
                    className="text-xs px-2 py-0.5 bg-red/20 text-red rounded"
                  >
                    回看: {note}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-text-secondary mb-4">{diagnostic.summary}</p>

      <button
        onClick={onNext}
        className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
      >
        下一题
      </button>
    </div>
  )
}
