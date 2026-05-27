import { useState } from 'react'

interface Props {
  stem: string
  onSubmit: (answer: string) => void
  disabled: boolean
}

export function FillInBlankQuestion({ stem, onSubmit, disabled }: Props) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return
    onSubmit(answer.trim())
  }

  return (
    <div>
      <p className="text-lg text-gray-900 mb-6">{stem}</p>
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        disabled={disabled}
        placeholder="输入你的答案..."
        className="w-full p-4 border border-gray-200 rounded-lg focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-50"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
      >
        提交答案
      </button>
    </div>
  )
}
