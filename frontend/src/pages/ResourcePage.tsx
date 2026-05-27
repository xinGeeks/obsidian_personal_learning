import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ResourceItem, SearchResult } from '../lib/types'
import { fetchResourceList, processResource, saveResourceNote, searchResources } from '../lib/resourcesApi'
import { useStore } from '../lib/store'

export function ResourcePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { startQuiz } = useStore()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Load saved resources
  useEffect(() => {
    async function load() {
      try { setResources(await fetchResourceList()) }
      catch (e: unknown) { setError((e as Error).message) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Auto-search from ?q= param
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchQuery(q)
      doSearch(q)
    }
  }, [searchParams])

  const doSearch = async (q: string) => {
    if (!q.trim()) return
    setSearching(true)
    try {
      const results = await searchResources([], q)
      setSearchResults(results)
    } catch (e: unknown) { setError((e as Error).message) }
    setSearching(false)
  }

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(searchQuery)
  }

  const handleProcess = useCallback(async (result: SearchResult) => {
    setProcessing(p => ({ ...p, [result.url]: true }))
    try {
      const resource = await processResource(result.url, [])
      setResources(prev => [resource, ...prev])
      setSearchResults(prev => prev.filter(r => r.url !== result.url))
    } catch (e: unknown) { setError((e as Error).message) }
    setProcessing(p => ({ ...p, [result.url]: false }))
  }, [])

  const handleSaveNote = useCallback(async (r: ResourceItem) => {
    setSaving(s => ({ ...s, [r.id]: true }))
    try {
      await saveResourceNote(r.id)
      setResources(prev => prev.map(x => x.id === r.id ? { ...x, saved_note_path: 'saved' } : x))
    } catch (e: unknown) { setError((e as Error).message) }
    setSaving(s => ({ ...s, [r.id]: false }))
  }, [])

  const handleStartQuiz = useCallback(async (r: ResourceItem) => {
    await useStore.getState().startReview(r.id)
    navigate('/quiz')
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-5 py-3 shrink-0 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600">← 仪表盘</button>
        <h1 className="text-base font-semibold text-gray-900">学习资料库</h1>
        <span className="text-xs text-gray-400">{resources.length} 份已保存</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <input type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="搜索外部资料..."
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-52 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none" />
          <button onClick={() => doSearch(searchQuery)} disabled={searching}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">
            {searching ? '搜索中...' : '搜索'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto space-y-6">
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">搜索结果</h2>
            <div className="space-y-3">
              {searchResults.map(r => (
                <div key={r.url} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{r.source}</span>
                    <span className="text-xs text-gray-400">权重 {r.score.toFixed(2)}</span>
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.snippet}</p>
                  <div className="flex items-center gap-2">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                      查看原文 ↗
                    </a>
                    <button onClick={() => handleProcess(r)} disabled={processing[r.url]}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                      {processing[r.url] ? '处理中...' : 'AI 加工'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved Resources */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {resources.length > 0 ? '已保存资料' : '学习资料'}
          </h2>

          {resources.length === 0 && searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-1">暂无学习资料</p>
              <p className="text-gray-400 text-xs mb-4">搜索外部资料或从知识图谱查找</p>
              <button onClick={() => navigate('/graph')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">前往知识图谱</button>
            </div>
          ) : resources.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">还没有保存的资料，搜索并处理文章后会出现在这里</p>
          ) : (
            <div className="space-y-3">
              {resources.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{r.source}</span>
                    {r.reviewed && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">已学习</span>}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.summary.slice(0, 200)}{r.summary.length > 200 ? '...' : ''}</p>
                  {r.key_points.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {r.key_points.slice(0, 5).map((kp, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">{kp}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                      查看原文 ↗
                    </a>
                    {r.quiz_questions.length > 0 && (
                      <button onClick={() => handleStartQuiz(r)}
                        className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        开始答题
                      </button>
                    )}
                    {!r.saved_note_path && (
                      <button onClick={() => handleSaveNote(r)} disabled={saving[r.id]}
                        className="text-xs px-3 py-1.5 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50">
                        {saving[r.id] ? '保存中...' : '保存笔记'}
                      </button>
                    )}
                    {r.saved_note_path && <span className="text-xs text-green-600">已保存到 vault</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
