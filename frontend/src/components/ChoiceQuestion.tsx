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
      <p className="text-lg text-gray-900 mb-6">{stem}</p>
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              selected === opt
                ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } disabled:cursor-not-allowed`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected || disabled}
        className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
      >
        提交答案
      </button>
    </div>
  )
}
