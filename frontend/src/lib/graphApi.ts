import type { ConceptDetail, ExtractionStatus, GraphData } from './types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || res.statusText)
  }
  return res.json()
}

export async function fetchGraphOverview(): Promise<GraphData> {
  return request<GraphData>('/graph/overview')
}

export async function fetchExtractionStatus(): Promise<ExtractionStatus> {
  return request<ExtractionStatus>('/graph/extraction-status')
}

export async function triggerExtraction(): Promise<{ message: string }> {
  return request<{ message: string }>('/graph/trigger-extraction', { method: 'POST' })
}

export async function fetchConcept(id: string): Promise<ConceptDetail> {
  return request<ConceptDetail>(`/graph/concept/${encodeURIComponent(id)}`)
}
