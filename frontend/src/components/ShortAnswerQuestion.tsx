import { useState } from 'react'

interface Props {
  stem: string
  onSubmit: (answer: string) => void
  disabled: boolean
}

export function ShortAnswerQuestion({ stem, onSubmit, disabled }: Props) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return
    onSubmit(answer.trim())
  }

  return (
    <div>
      <p className="text-lg text-text-primary mb-6">{stem}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        placeholder="写下你的回答..."
        rows={5}
        className="w-full p-4 bg-bg-base border border-border-card rounded-lg text-text-primary placeholder:text-text-secondary focus:border-accent/30 focus:ring-2 focus:ring-accent/20 outline-none disabled:bg-bg-hover/30 resize-none"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || disabled}
        className="mt-6 w-full py-3 bg-accent text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
      >
        提交答案
      </button>
    </div>
  )
}
