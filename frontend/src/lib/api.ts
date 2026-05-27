import type { Evaluation, LearningSummary, MasteryOverview, NoteInfo, Quiz, RecommendationItem, SessionRecord } from './types'

import { API_BASE } from './base'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || res.statusText)
  }
  return res.json()
}

export async function fetchNotes(): Promise<NoteInfo[]> {
  return request<NoteInfo[]>('/vault/notes')
}

export async function fetchNoteContent(path: string) {
  return request<{
    rawContent: string
    plainText: string
    frontmatter: Record<string, unknown>
    tags: string[]
    links: string[]
  }>(`/vault/notes/${encodeURIComponent(path)}`)
}

export async function generateQuiz(notePaths: string[]): Promise<Quiz> {
  return request<Quiz>('/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ note_paths: notePaths }),
  })
}

export async function evaluateAnswer(
  quizId: string,
  questionIndex: number,
  userAnswer: string,
): Promise<Evaluation> {
  return request<Evaluation>('/quiz/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      quiz_id: quizId,
      question_index: questionIndex,
      user_answer: userAnswer,
    }),
  })
}

export async function saveSession(session: SessionRecord): Promise<SessionRecord> {
  return request<SessionRecord>('/learning/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}

export async function fetchHistory(params?: {
  date_from?: string
  date_to?: string
  source_note?: string
}): Promise<SessionRecord[]> {
  const qs = new URLSearchParams()
  if (params?.date_from) qs.set('date_from', params.date_from)
  if (params?.date_to) qs.set('date_to', params.date_to)
  if (params?.source_note) qs.set('source_note', params.source_note)
  const query = qs.toString()
  return request<SessionRecord[]>(`/learning/history${query ? `?${query}` : ''}`)
}

export async function fetchSummary(): Promise<LearningSummary> {
  return request<LearningSummary>('/learning/summary')
}

export async function fetchMasteryOverview(): Promise<MasteryOverview> {
  return request<MasteryOverview>('/mastery/overview')
}

export async function fetchRecommendations(): Promise<{ items: RecommendationItem[]; message?: string }> {
  return request<{ items: RecommendationItem[]; message?: string }>('/mastery/recommendations')
}
