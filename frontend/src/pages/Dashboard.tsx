import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ConceptEdge, ConceptNode, MasteryOverview, RecommendationItem, ResourceItem } from '../lib/types'
import { fetchMasteryOverview, fetchRecommendations } from '../lib/api'
import { fetchGraphOverview, triggerExtraction } from '../lib/graphApi'
import { fetchResourceRecommendations } from '../lib/resourcesApi'
import { useStore } from '../lib/store'
import { GraphMini } from '../components/GraphMini'

function masteryColor(m: number): string {
  if (m < 0.3) return 'bg-red-500'
  if (m < 0.6) return 'bg-yellow-500'
  return 'bg-green-500'
}

function masteryLabel(m: number): string {
  if (m < 0.3) return '薄弱'
  if (m < 0.6) return '一般'
  return '熟练'
}

function masteryTextColor(m: number): string {
  if (m < 0.3) return 'text-red-600'
  if (m < 0.6) return 'text-yellow-600'
  return 'text-green-600'
}

export function Dashboard() {
  const navigate = useNavigate()
  const { quiz, phase, startReview } = useStore()
  const [overview, setOverview] = useState<MasteryOverview | null>(null)
  const [recs, setRecs] = useState<RecommendationItem[]>([])
  const [recsMsg, setRecsMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [graphConcepts, setGraphConcepts] = useState<ConceptNode[]>([])
  const [graphEdges, setGraphEdges] = useState<ConceptEdge[]>([])
  const [triggering, setTriggering] = useState(false)
  const [resourceRecs, setResourceRecs] = useState<{ concept_name: string; concept_id: string; resource: ResourceItem; reason: string }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [ov, rc, graph, rRecs] = await Promise.all([
          fetchMasteryOverview(),
          fetchRecommendations(),
          fetchGraphOverview().catch(() => null),
          fetchResourceRecommendations().catch(() => ({ items: [] })) as Promise<{ items: typeof resourceRecs }>,
        ])
        setOverview(ov)
        setRecs(rc.items)
        setRecsMsg(rc.message || '')
        if (graph) {
          setGraphConcepts(graph.concepts)
          setGraphEdges(graph.edges)
        }
        setResourceRecs((rRecs as { items: typeof resourceRecs }).items || [])
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleTriggerExtraction = async () => {
    setTriggering(true)
    try {
      await triggerExtraction()
    } catch (e: unknown) {
      setError((e as Error).message)
    }
    setTriggering(false)
  }

  useEffect(() => {
    if (quiz && phase === 'quiz') {
      navigate('/quiz')
    }
  }, [quiz, phase, navigate])

  const handleStartReview = (notePath: string) => {
    startReview(notePath)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">学习仪表盘</h1>
          <button onClick={() => navigate('/settings')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="设置">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {overview && overview.notes.length > 0
            ? `整体掌握度 ${Math.round(overview.overall_mastery * 100)}% · ${overview.notes.length} 篇笔记`
            : '开始你的学习之旅'}
        </p>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Recommendations Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">今日推荐复习</h2>

          {recs.length === 0 ? (
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                {recsMsg || '当前没有需要复习的内容'}
              </p>
              {overview && overview.notes.length === 0 && (
                <button
                  onClick={() => navigate('/select')}
                  className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  选择笔记开始学习
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recs.map((item) => (
                <div
                  key={item.note_path}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1">
                      {item.title}
                    </h3>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${masteryTextColor(item.mastery)} bg-opacity-10 bg-current`}
                    >
                      {masteryLabel(item.mastery)} {Math.round(item.mastery * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{item.reason}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      逾期 {item.overdue_days} 天
                    </span>
                    <button
                      onClick={() => handleStartReview(item.note_path)}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      开始复习
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mastery Overview Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">全部笔记掌握度</h2>

          {!overview || overview.notes.length === 0 ? (
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                还没有学习记录，完成首次答题后这里会显示掌握度
              </p>
              <button
                onClick={() => navigate('/select')}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                选择笔记开始学习
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {overview.notes.map((entry) => (
                <div
                  key={entry.note_path}
                  className="bg-white rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate flex-1">
                      {entry.title}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {Math.round(entry.mastery * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${masteryColor(entry.mastery)}`}
                      style={{ width: `${Math.round(entry.mastery * 100)}%` }}
                    />
                  </div>
                  {entry.weak_concepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.weak_concepts.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resource Recommendations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">推荐学习资料</h2>
            {resourceRecs.length > 0 && (
              <button onClick={() => navigate('/resources')} className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                查看全部 →
              </button>
            )}
          </div>

          {resourceRecs.length > 0 ? (
            <div className="space-y-2">
              {resourceRecs.slice(0, 3).map((item, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">{item.resource.source}</span>
                    <span className="text-xs text-gray-500">{item.reason.slice(0, 40)}...</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate mb-1">{item.resource.title}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{item.resource.summary.slice(0, 100)}</p>
                  <button onClick={() => navigate('/resources')}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium">
                    查看详情
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-gray-200 text-center">
              <p className="text-gray-400 text-xs">暂无推荐资料，知识图谱中的薄弱概念会自动触发推荐</p>
            </div>
          )}
        </section>

        {/* Mini Knowledge Graph */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">知识图谱概览</h2>
            <div className="flex items-center gap-3">
              {graphConcepts.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />薄弱</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />一般</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />熟练</span>
                  <span className="mx-1 text-gray-300">|</span>
                  <span>── 前置</span>
                  <span>- - 关联</span>
                </div>
              )}
              {graphConcepts.length > 0 && (
                <button
                  onClick={() => navigate('/graph')}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                >
                  完整图谱 →
                </button>
              )}
            </div>
          </div>

          {graphConcepts.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <GraphMini concepts={graphConcepts} edges={graphEdges} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-1">知识图谱尚未构建</p>
              <p className="text-gray-400 text-xs mb-4">AI 将自动提取笔记中的知识点和关联关系</p>
              <button
                onClick={handleTriggerExtraction}
                disabled={triggering}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {triggering ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    正在构建...
                  </span>
                ) : (
                  '开始构建知识图谱'
                )}
              </button>
            </div>
          )}
        </section>

        {/* New content link */}
        <div className="text-center pb-4">
          <button
            onClick={() => navigate('/select')}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            + 选择其他笔记学习
          </button>
        </div>
      </main>
    </div>
  )
}
