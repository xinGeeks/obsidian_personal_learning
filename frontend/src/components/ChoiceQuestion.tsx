import { useState } from 'react'

interface Props {
  stem: string
  options: string[]
  onSubmit: (answer: string) => void
  disabled: boolean
}

export function ChoiceQuestion({ stem, options, onSubmit, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!selected || disabled) return
    onSubmit(selected)
  }

  return (
    <div>
      <p className="text-lg text-text-primary mb-6">{stem}</p>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border transition-colors duration-200 ${
              selected === opt
                ? 'border-accent/30 bg-accent/10 ring-2 ring-accent/20'
                : 'border-border-card bg-bg-card hover:border-accent/20'
            } disabled:cursor-not-allowed text-text-primary`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected || disabled}
        className="mt-6 w-full py-3 bg-accent text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
      >
        提交答案
      </button>
    </div>
  )
}
