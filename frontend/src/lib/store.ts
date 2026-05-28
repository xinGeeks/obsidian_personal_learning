import { create } from 'zustand'
import type { Evaluation, NoteInfo, Quiz } from './types'
import { evaluateAnswer, fetchNotes, generateQuiz, saveSession } from './api'

type Phase = 'select' | 'loading' | 'quiz' | 'evaluating' | 'review' | 'done'

interface AppState {
  phase: Phase
  notes: NoteInfo[]
  selectedPaths: string[]
  quiz: Quiz | null
  currentIndex: number
  evaluations: Record<number, Evaluation>
  error: string | null

  loadNotes: () => Promise<void>
  toggleNote: (path: string) => void
  startQuiz: () => Promise<void>
  submitAnswer: (answer: string) => Promise<void>
  nextQuestion: () => void
  startReview: (notePath: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  phase: 'select',
  notes: [],
  selectedPaths: [],
  quiz: null,
  currentIndex: 0,
  evaluations: {},
  error: null,

  loadNotes: async () => {
    try {
      const notes = await fetchNotes()
      set({ notes, error: null })
    } catch (e: unknown) {
      set({ error: (e as Error).message })
    }
  },

  toggleNote: (path) => {
    const { selectedPaths } = get()
    set({
      selectedPaths: selectedPaths.includes(path)
        ? selectedPaths.filter((p) => p !== path)
        : [...selectedPaths, path],
    })
  },

  startQuiz: async () => {
    const { selectedPaths } = get()
    if (selectedPaths.length === 0) return
    set({ phase: 'loading', error: null })
    try {
      const quiz = await generateQuiz(selectedPaths)
      set({ quiz, currentIndex: 0, evaluations: {}, phase: 'quiz' })
    } catch (e: unknown) {
      set({ error: (e as Error).message, phase: 'select' })
    }
  },

  startReview: async (notePath: string) => {
    set({ selectedPaths: [notePath], phase: 'loading', error: null })
    try {
      const quiz = await generateQuiz([notePath])
      set({ quiz, currentIndex: 0, evaluations: {}, phase: 'quiz' })
    } catch (e: unknown) {
      set({ error: (e as Error).message, phase: 'select' })
    }
  },

  submitAnswer: async (answer) => {
    const { quiz, currentIndex } = get()
    if (!quiz) return
    set({ phase: 'evaluating' })
    try {
      const evalResult = await evaluateAnswer(
        quiz.quiz_id,
        currentIndex,
        answer,
      )
      set({
        evaluations: { ...get().evaluations, [currentIndex]: evalResult },
        phase: 'review',
      })
    } catch (e: unknown) {
      set({ error: (e as Error).message, phase: 'quiz' })
    }
  },

  nextQuestion: () => {
    const { quiz, currentIndex } = get()
    if (!quiz) return
    if (currentIndex + 1 >= quiz.questions.length) {
      const state = get()
      const session = {
        session_id: crypto.randomUUID(),
        quiz_id: quiz.quiz_id,
        started_at: quiz.generated_at,
        completed_at: new Date().toISOString(),
        questions: quiz.questions.map((q, i) => ({
          question: q,
          user_answer: '',
          evaluation: state.evaluations[i] || null,
        })),
        total_score:
          Object.values(state.evaluations).reduce(
            (sum, e) => sum + e.score,
            0,
          ) / Math.max(quiz.questions.length, 1),
        source_notes: quiz.source_notes,
      }
      saveSession(session).catch(() => {})
      set({ phase: 'done' })
    } else {
      set({ currentIndex: currentIndex + 1, phase: 'quiz' })
    }
  },
}))
