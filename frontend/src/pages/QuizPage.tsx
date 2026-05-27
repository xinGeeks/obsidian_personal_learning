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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              第 {currentIndex + 1} / {quiz.questions.length} 题
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
              {question.type === 'choice'
                ? '选择题'
                : question.type === 'fill_in_blank'
                  ? '填空题'
                  : '简答题'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">AI 正在评测你的答案...</p>
            </div>
          )}

          {phase === 'review' && evaluation && (
            <EvaluationDisplay evaluation={evaluation} onNext={nextQuestion} />
          )}
        </div>
      </main>
    </div>
  )
}
