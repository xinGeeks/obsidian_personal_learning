import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as d3 from 'd3'
import type { ConceptEdge, ConceptNode } from '../lib/types'
import { fetchConcept, fetchGraphOverview } from '../lib/graphApi'

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  mastery: number
  group: number
  degree: number
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: string
  label: string
}

interface DetailData {
  description: string
  mastery: number
  confidence: number
  total_attempts: number
  source_notes: string[]
  weak_points: string[]
  related_concepts: { id: string; name: string; relation_type: string; relation_label: string }[]
}

function masteryColor(m: number): string {
  if (m < 0.3) return '#ef4444'
  if (m < 0.6) return '#eab308'
  return '#22c55e'
}
function masteryBg(m: number): string {
  if (m < 0.3) return 'bg-red-50 border-red-200'
  if (m < 0.6) return 'bg-yellow-50 border-yellow-200'
  return 'bg-green-50 border-green-200'
}
function masteryText(m: number): string {
  if (m < 0.3) return 'text-red-700'
  if (m < 0.6) return 'text-yellow-700'
  return 'text-green-700'
}

const GROUP_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

export function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [concepts, setConcepts] = useState<ConceptNode[]>([])
  const [edges, setEdges] = useState<ConceptEdge[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<ConceptNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterMastery, setFilterMastery] = useState<'all' | 'weak' | 'medium' | 'strong'>('all')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchGraphOverview()
        setConcepts(data.concepts)
        setEdges(data.edges)
      } catch (e: unknown) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Compute groups via connected components
  const groups = useMemo(() => {
    const adj = new Map<string, Set<string>>()
    for (const c of concepts) adj.set(c.id, new Set())
    for (const e of edges) {
      adj.get(e.from)?.add(e.to)
      adj.get(e.to)?.add(e.from)
    }
    const visited = new Set<string>()
    const comps: string[][] = []
    for (const c of concepts) {
      if (visited.has(c.id)) continue
      const comp: string[] = []
      const stack = [c.id]
      while (stack.length) {
        const id = stack.pop()!
        if (visited.has(id)) continue
        visited.add(id)
        comp.push(id)
        for (const nb of adj.get(id) || []) stack.push(nb)
      }
      comps.push(comp)
    }
    const groupMap = new Map<string, number>()
    comps.sort((a, b) => b.length - a.length)
    comps.forEach((comp, i) => comp.forEach(id => groupMap.set(id, i)))
    return groupMap
  }, [concepts, edges])

  // Build sim nodes/links with filters
  const { simNodes, simLinks } = useMemo(() => {
    const filtered = concepts.filter(c => {
      if (filterMastery === 'weak') return c.mastery < 0.3
      if (filterMastery === 'medium') return c.mastery >= 0.3 && c.mastery < 0.6
      if (filterMastery === 'strong') return c.mastery >= 0.6
      return true
    })
    const fIds = new Set(filtered.map(c => c.id))
    const degree = new Map<string, number>()
    for (const e of edges) {
      degree.set(e.from, (degree.get(e.from) || 0) + 1)
      degree.set(e.to, (degree.get(e.to) || 0) + 1)
    }
    const nodes: SimNode[] = filtered.map(c => ({
      id: c.id, name: c.name, mastery: c.mastery,
      group: groups.get(c.id) || 0,
      degree: degree.get(c.id) || 0,
    }))
    const links: SimLink[] = edges
      .filter(e => fIds.has(e.from) && fIds.has(e.to))
      .map(e => ({ source: e.from, target: e.to, type: e.type, label: e.label }))
    return { simNodes: nodes, simLinks: links }
  }, [concepts, edges, filterMastery, groups])

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || simNodes.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const width = svgRef.current.clientWidth || 900
    const height = svgRef.current.clientHeight || 600

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8')

    const labelThreshold = simNodes.length > 100 ? 3 : simNodes.length > 50 ? 2 : 0

    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .alphaDecay(0.03)
      .velocityDecay(0.35)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>(18))
    simRef.current = simulation

    // Pre-layout: run simulation silently to stable before first render
    simulation.stop()
    for (let i = 0; i < 80; i++) simulation.tick()

    const g = svg.append('g')

    const link = g.selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks).join('line')
      .attr('stroke', d => d.type === 'prerequisite_of' ? '#94a3b8' : '#cbd5e1')
      .attr('stroke-width', d => d.type === 'prerequisite_of' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'related_to' ? '4,3' : '')
      .attr('marker-end', d => d.type === 'prerequisite_of' ? 'url(#arrow)' : '')
      .attr('opacity', 0.6)

    const nodeG = g.selectAll<SVGGElement, SimNode>('g')
      .data(simNodes).join('g').attr('cursor', 'pointer')
      .attr('transform', d => `translate(${d.x},${d.y})`)

    nodeG.append('circle')
      .attr('r', d => 5 + d.degree * 1.2)
      .attr('fill', d => {
        const gIdx = d.group % GROUP_COLORS.length
        return d.mastery < 0.3 ? masteryColor(d.mastery) : GROUP_COLORS[gIdx]
      })
      .attr('stroke', '#fff').attr('stroke-width', 2)
      .attr('opacity', 0.85)

    // Only show labels for high-degree nodes or when few nodes
    const labels = nodeG.append('text')
      .text(d => d.degree >= labelThreshold ? (d.name.length > 8 ? d.name.slice(0, 7) + '…' : d.name) : '')
      .attr('font-size', 9).attr('text-anchor', 'middle')
      .attr('dy', d => -(9 + d.degree * 1.2 + 5))
      .attr('fill', '#4b5563').attr('pointer-events', 'none')
      .style('font-weight', d => d.degree >= 3 ? '600' : '400')

    // Hover highlight — throttle to avoid layout thrashing
    nodeG.on('mouseenter', (_e, d) => {
      link.attr('opacity', l => (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id ? 1 : 0.1)
      nodeG.selectAll('circle').attr('opacity', n => {
        if (n.id === d.id) return 1
        const connected = simLinks.some(l =>
          ((l.source as SimNode).id === d.id && (l.target as SimNode).id === n.id) ||
          ((l.target as SimNode).id === d.id && (l.source as SimNode).id === n.id)
        )
        return connected ? 0.7 : 0.15
      })
      // Show label on hover
      nodeG.filter(n => n.id === d.id).select('text').text(d.name)
    })
    nodeG.on('mouseleave', () => {
      link.attr('opacity', 0.6)
      nodeG.selectAll('circle').attr('opacity', 0.85)
      // Restore default labels
      labels.text(d => d.degree >= labelThreshold ? (d.name.length > 8 ? d.name.slice(0, 7) + '…' : d.name) : '')
    })

    nodeG.on('click', (_e, d) => handleNodeClick(d.id))
    nodeG.call(d3.drag<SVGGElement, SimNode>()
      .on('start', (_e, d) => { if (!_e.active) simulation.alphaTarget(0.15).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (_e, d) => { d.fx = _e.x; d.fy = _e.y })
      .on('end', (_e, d) => { if (!_e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null }) as never)

    // Throttled tick — only update every 2nd tick for 100+ nodes
    let tickCount = 0
    const tickSkip = simNodes.length > 100 ? 2 : 1
    simulation.on('tick', () => {
      tickCount++
      if (tickCount % tickSkip !== 0) return
      link.attr('x1', d => (d.source as SimNode).x!).attr('y1', d => (d.source as SimNode).y!)
          .attr('x2', d => (d.target as SimNode).x!).attr('y2', d => (d.target as SimNode).y!)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Restart simulation after pre-layout
    simulation.alpha(1).restart()

    // Focus param
    const focusId = searchParams.get('focus')
    if (focusId) {
      const target = simNodes.find(n => n.id === focusId)
      if (target) {
        handleNodeClick(focusId)
        setTimeout(() => {
          if (target.x && target.y) {
            svg.transition().duration(600).call(
              d3.zoom<SVGSVGElement, unknown>().transform as never,
              d3.zoomIdentity.translate(width / 2 - target.x, height / 2 - target.y).scale(1.6),
            )
          }
        }, 200)
      }
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 6])
      .on('zoom', (event) => g.attr('transform', event.transform.toString()))
    svg.call(zoom)

    // Keyboard: Esc close, Ctrl+F search
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedId(null); setDetail(null) }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      simulation.stop()
      window.removeEventListener('keydown', onKey)
    }
  }, [simNodes, simLinks])

  const handleNodeClick = useCallback(async (id: string) => {
    const concept = concepts.find(c => c.id === id)
    if (!concept) return
    setSelectedId(id)
    try {
      const d = await fetchConcept(id)
      setDetail({
        description: concept.description,
        mastery: concept.mastery,
        confidence: concept.confidence,
        total_attempts: concept.total_attempts,
        source_notes: concept.source_notes,
        weak_points: concept.weak_points || [],
        related_concepts: (d as unknown as DetailData).related_concepts || [],
      })
    } catch {
      setDetail({
        description: concept.description,
        mastery: concept.mastery,
        confidence: concept.confidence,
        total_attempts: concept.total_attempts,
        source_notes: concept.source_notes,
        weak_points: concept.weak_points || [],
        related_concepts: [],
      })
    }
  }, [concepts])

  const handleSearch = (name?: string) => {
    const q = (name || search).trim()
    if (!q) return
    const found = concepts.find(c =>
      c.name.includes(q) || c.aliases?.some(a => a.includes(q))
    )
    if (found) {
      navigate(`/graph?focus=${found.id}`, { replace: true })
      setSearch('')
      setSuggestions([])
    }
  }

  const handleSearchInput = (val: string) => {
    setSearch(val)
    if (val.trim().length < 1) { setSuggestions([]); return }
    setSuggestions(
      concepts.filter(c =>
        c.name.includes(val) || c.aliases?.some(a => a.includes(val))
      ).slice(0, 8)
    )
  }

  // Learning path for selected node (topological sort of prerequisites)
  const learningPath = useMemo(() => {
    if (!selectedId) return []
    const path: { id: string; name: string; mastery: number }[] = []
    const visited = new Set<string>()
    const queue = [selectedId]
    while (queue.length) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      const c = concepts.find(x => x.id === id)
      if (c) path.push({ id: c.id, name: c.name, mastery: c.mastery })
      for (const e of edges) {
        if (e.to === id && !visited.has(e.from)) queue.push(e.from)
      }
    }
    return path
  }, [selectedId, concepts, edges])

  const stats = useMemo(() => {
    const total = concepts.length
    const weak = concepts.filter(c => c.mastery < 0.3).length
    const med = concepts.filter(c => c.mastery >= 0.3 && c.mastery < 0.6).length
    const strong = concepts.filter(c => c.mastery >= 0.6).length
    return { total, weak, med, strong }
  }, [concepts])

  // ── Render ──

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400">加载知识图谱...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-600 font-medium mb-2">加载失败</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">重试</button>
        </div>
      </div>
    )
  }

  if (concepts.length === 0) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-1">知识图谱尚未构建</p>
          <p className="text-sm text-gray-400 mb-4">前往仪表盘触发 AI 知识提取</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">返回仪表盘</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-5 py-2.5 shrink-0 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 仪表盘</button>
        <h1 className="text-base font-semibold text-gray-900">知识图谱</h1>

        {/* Stats pills */}
        <div className="flex items-center gap-1.5 ml-2">
          <button onClick={() => setFilterMastery('all')}
            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${filterMastery === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            全部 {stats.total}
          </button>
          <button onClick={() => setFilterMastery('weak')}
            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${filterMastery === 'weak' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
            薄弱 {stats.weak}
          </button>
          <button onClick={() => setFilterMastery('medium')}
            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${filterMastery === 'medium' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}>
            一般 {stats.med}
          </button>
          <button onClick={() => setFilterMastery('strong')}
            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${filterMastery === 'strong' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            熟练 {stats.strong}
          </button>
        </div>

        <div className="flex-1" />

        {/* Search with dropdown */}
        <div className="relative">
          <input
            type="text" value={search}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setSuggestions([]) }}
            onFocus={() => search.trim() && handleSearchInput(search)}
            onBlur={() => setTimeout(() => setSuggestions([]), 200)}
            placeholder="搜索知识点... (Ctrl+F)"
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-52 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {suggestions.map(c => (
                <button key={c.id} onMouseDown={() => handleSearch(c.name)}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <span>{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{Math.round(c.mastery * 100)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => {
            const svg = d3.select(svgRef.current)
            svg.transition().duration(200).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as never, 1.3)
          }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded text-sm" title="放大">+</button>
          <button onClick={() => {
            const svg = d3.select(svgRef.current)
            svg.transition().duration(200).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as never, 0.7)
          }} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded text-sm" title="缩小">−</button>
          <button onClick={() => {
            const svg = d3.select(svgRef.current)
            svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().transform as never, d3.zoomIdentity)
          }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded text-xs" title="重置">⊙</button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex relative">
        {/* Mini legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur rounded-lg border border-gray-200 px-3 py-2 text-[10px] text-gray-400 space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />薄弱 &lt;30%</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />一般 30-60%</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />熟练 &gt;60%</div>
          <div className="border-t border-gray-100 my-1" />
          <div className="flex items-center gap-1.5"><span className="w-4 h-px bg-slate-400 inline-block" /><span className="text-[8px]">▶</span> 前置依赖</div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-px bg-slate-300 inline-block" style={{ strokeDasharray: '3,2' }} /> 关联</div>
        </div>

        <div className="flex-1 relative">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Detail panel */}
        {selectedId && detail && (() => {
          const concept = concepts.find(c => c.id === selectedId)
          if (!concept) return null
          return (
            <aside className={`w-80 border-l p-4 overflow-y-auto shrink-0 ${masteryBg(concept.mastery)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-semibold text-gray-900">{concept.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{detail.description || '暂无定义'}</p>
                </div>
                <button onClick={() => { setSelectedId(null); setDetail(null) }}
                  className="text-gray-300 hover:text-gray-500 text-lg leading-none shrink-0">×</button>
              </div>

              {/* Mastery bar */}
              <div className="mb-4 mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>掌握度</span><span className="font-medium">{Math.round(detail.mastery * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200/50 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{
                    width: `${Math.round(detail.mastery * 100)}%`,
                    backgroundColor: masteryColor(detail.mastery),
                  }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>答题 {detail.total_attempts} 次</span>
                  <span>置信度 {Math.round(detail.confidence * 100)}%</span>
                </div>
              </div>

              {/* Weak points */}
              {detail.weak_points.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">薄弱环节</p>
                  <div className="flex flex-wrap gap-1">
                    {detail.weak_points.map(w => (
                      <span key={w} className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning path */}
              {learningPath.length > 1 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">学习路径（前置 → 后置）</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {learningPath.map((node, i) => (
                      <span key={node.id} className="flex items-center gap-1">
                        {i > 0 && <span className="text-gray-300 text-[10px]">→</span>}
                        <button onClick={() => handleNodeClick(node.id)}
                          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                            node.id === selectedId
                              ? 'bg-purple-100 text-purple-700 font-medium'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {node.name}
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search external resources */}
              <button
                onClick={() => navigate(`/resources?q=${encodeURIComponent(concept.name)}`)}
                className="w-full mb-3 py-2 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors"
              >
                查找学习资料 →
              </button>

              {/* Source notes */}
              {detail.source_notes.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">来源笔记</p>
                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                    {detail.source_notes.map(sn => (
                      <p key={sn} className="text-xs text-gray-500 truncate">{sn}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Related concepts */}
              {detail.related_concepts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">关联知识点</p>
                  <div className="space-y-0.5">
                    {detail.related_concepts.map(rc => {
                      const rcConcept = concepts.find(c => c.id === rc.id)
                      return (
                        <button key={rc.id} onClick={() => handleNodeClick(rc.id)}
                          className="block w-full text-left text-xs p-2 rounded hover:bg-white/50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 group-hover:text-purple-700">{rc.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              rc.relation_type === 'prerequisite_of' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {rc.relation_type === 'prerequisite_of' ? '前置→' : '关联'}
                            </span>
                          </div>
                          {rcConcept && (
                            <div className="w-full bg-gray-200/50 rounded-full h-1 mt-1">
                              <div className="h-1 rounded-full" style={{
                                width: `${Math.round(rcConcept.mastery * 100)}%`,
                                backgroundColor: masteryColor(rcConcept.mastery),
                              }} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </aside>
          )
        })()}
      </div>
    </div>
  )
}
