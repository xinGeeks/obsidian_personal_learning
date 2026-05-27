import type { ResourceItem, SearchResult } from './types'

const BASE = '/api'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
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

export async function searchResources(conceptIds: string[], query?: string): Promise<SearchResult[]> {
  const r = await req<{ results: SearchResult[] }>('/resources/search', {
    method: 'POST',
    body: JSON.stringify({ concept_ids: conceptIds, query: query || '' }),
  })
  return r.results
}

export async function processResource(url: string, conceptIds: string[]): Promise<ResourceItem> {
  const r = await req<{ resource: ResourceItem }>('/resources/process', {
    method: 'POST',
    body: JSON.stringify({ url, concept_ids: conceptIds }),
  })
  return r.resource
}

export async function saveResourceNote(resourceId: string): Promise<string> {
  const r = await req<{ note_path: string }>('/resources/save-note', {
    method: 'POST',
    body: JSON.stringify({ resource_id: resourceId }),
  })
  return r.note_path
}

export async function fetchResourceList(): Promise<ResourceItem[]> {
  const r = await req<{ resources: ResourceItem[] }>('/resources/list')
  return r.resources
}

export async function fetchResourceRecommendations(): Promise<
  { concept_name: string; concept_id: string; resource: ResourceItem; reason: string }[]
> {
  const r = await req<{ items: { concept_name: string; concept_id: string; resource: ResourceItem; reason: string }[] }>('/resources/recommendations')
  return r.items
}
