import { useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

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
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-text-primary">笔记学习</h1>
        <p className="text-sm text-text-secondary mt-0.5">选择今天要学习的笔记</p>
        <div className="mt-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记标题或路径..."
            className="w-full max-w-md px-3 py-2 bg-bg-card border border-border-card rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:border-accent/30 focus:ring-2 focus:ring-accent/20 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red/10 border border-red/20 rounded-xl text-red text-sm">
          {error}
        </div>
      )}

      {filtered.length === 0 && !error && (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-lg">
            {search ? '没有匹配的笔记' : 'Vault 中没有找到笔记'}
          </p>
          <p className="text-sm mt-2">
            {search ? '尝试其他关键词' : '请确认 VAULT_PATH 配置正确'}
          </p>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {visible.map((note) => (
          <label
            key={note.path}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors duration-200 ${
              selectedPaths.includes(note.path)
                ? 'border-accent/30 bg-accent/10'
                : 'border-border-card bg-bg-card hover:border-accent/20 hover:bg-bg-hover'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPaths.includes(note.path)}
              onChange={() => toggleNote(note.path)}
              className="w-4 h-4 rounded accent-accent shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {note.title}
              </p>
              <p className="text-xs text-text-secondary truncate">{note.path}</p>
            </div>
          </label>
        ))}

        {hasMore && (
          <div ref={loaderRef} className="py-4 text-center text-sm text-text-secondary">
            加载更多...
          </div>
        )}

        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="py-4 text-center text-xs text-text-secondary">
            已显示全部 {filtered.length} 篇笔记
          </p>
        )}
      </div>

      <div className="border-t border-border-card mt-4 pt-4 shrink-0 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          已选 {selectedPaths.length} 篇笔记
          {search && filtered.length !== notes.length && (
            <span className="text-text-secondary">
              {' '}/ 筛选自 {notes.length} 篇
            </span>
          )}
        </span>
        <button
          onClick={startQuiz}
          disabled={selectedPaths.length === 0 || phase === 'loading'}
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
        >
          {phase === 'loading' ? '正在生成试卷...' : '开始学习'}
        </button>
      </div>
    </div>
  )
}
