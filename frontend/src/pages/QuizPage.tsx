import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ChoiceQuestion } from '../components/ChoiceQuestion'
import { FillInBlankQuestion } from '../components/FillInBlankQuestion'
import { ShortAnswerQuestion } from '../components/ShortAnswerQuestion'
import { EvaluationDisplay } from '../components/EvaluationDisplay'

export function QuizPage() {
  const { quiz, currentIndex, phase, error, evaluations, submitAnswer, nextQuestion } =
    useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (phase === 'done') {
      navigate('/summary')
    }
  }, [phase, navigate])

  if (!quiz) return null
  const question = quiz.questions[currentIndex]
  const evaluation = evaluations[currentIndex]
  const progress = ((currentIndex + (evaluation ? 1 : 0)) / quiz.questions.length) * 100

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            第 {currentIndex + 1} / {quiz.questions.length} 题
          </span>
          <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">
            {question.type === 'choice'
              ? '选择题'
              : question.type === 'fill_in_blank'
                ? '填空题'
                : '简答题'}
          </span>
        </div>
        <div className="w-full bg-bg-hover rounded-full h-1.5">
          <div
            className="bg-accent h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red/10 border border-red/20 rounded-xl text-red text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 bg-bg-card rounded-xl border border-border-card p-6">
        {phase === 'quiz' && (
          <>
            {question.type === 'choice' && (
              <ChoiceQuestion
                stem={question.stem}
                options={question.options}
                onSubmit={submitAnswer}
                disabled={false}
              />
            )}
            {question.type === 'fill_in_blank' && (
              <FillInBlankQuestion
                stem={question.stem}
                onSubmit={submitAnswer}
                disabled={false}
              />
            )}
            {question.type === 'short_answer' && (
              <ShortAnswerQuestion
                stem={question.stem}
                onSubmit={submitAnswer}
                disabled={false}
              />
            )}
          </>
        )}

        {phase === 'evaluating' && (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">AI 正在评测你的答案...</p>
          </div>
        )}

        {phase === 'review' && evaluation && (
          <EvaluationDisplay evaluation={evaluation} onNext={nextQuestion} />
        )}
      </div>
    </div>
  )
}
