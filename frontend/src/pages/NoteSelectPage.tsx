import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

const PAGE_SIZE = 50

export function NoteSelectPage() {
  const { notes, selectedPaths, error, quiz, phase, loadNotes, toggleNote, startQuiz } =
    useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (quiz && phase === 'quiz') {
      navigate('/quiz')
    }
  }, [quiz, phase, navigate])

  const filtered = useMemo(() => {
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.path.toLowerCase().includes(q) ||
        n.filename.toLowerCase().includes(q),
    )
  }, [notes, search])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
        }
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, filtered.length])

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Personal Learning Hub</h1>
        <p className="text-sm text-gray-500 mt-1">选择今天要学习的笔记</p>
        <div className="mt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记标题或路径..."
            className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 overflow-y-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {filtered.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">
              {search ? '没有匹配的笔记' : 'Vault 中没有找到笔记'}
            </p>
            <p className="text-sm mt-2">
              {search ? '尝试其他关键词' : '请确认 VAULT_PATH 配置正确'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {visible.map((note) => (
            <label
              key={note.path}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedPaths.includes(note.path)
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPaths.includes(note.path)}
                onChange={() => toggleNote(note.path)}
                className="w-4 h-4 rounded accent-purple-600 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {note.title}
                </p>
                <p className="text-xs text-gray-400 truncate">{note.path}</p>
              </div>
            </label>
          ))}

          {hasMore && (
            <div
              ref={loaderRef}
              className="py-4 text-center text-sm text-gray-400"
            >
              加载更多...
            </div>
          )}

          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="py-4 text-center text-xs text-gray-400">
              已显示全部 {filtered.length} 篇笔记
            </p>
          )}
        </div>
      </main>

      <footer className="bg-white border-t px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-500">
            已选 {selectedPaths.length} 篇笔记
            {search && filtered.length !== notes.length && (
              <span className="text-gray-400">
                {' '}/ 筛选自 {notes.length} 篇
              </span>
            )}
          </span>
          <button
            onClick={startQuiz}
            disabled={selectedPaths.length === 0 || phase === 'loading'}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            {phase === 'loading' ? '正在生成试卷...' : '开始学习'}
          </button>
        </div>
      </footer>
    </div>
  )
}
