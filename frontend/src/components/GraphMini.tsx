import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'
import type { ConceptEdge, ConceptNode } from '../lib/types'

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  mastery: number
  degree: number
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: string
}

interface Props {
  concepts: ConceptNode[]
  edges: ConceptEdge[]
}

const COLOR = {
  low: '#ef4444',
  mid: '#eab308',
  high: '#22c55e',
  edge: '#d1d5db',
  prereq: '#9ca3af',
}

function pickNodes(concepts: ConceptNode[], edges: ConceptEdge[], limit: number): ConceptNode[] {
  const degree = new Map<string, number>()
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) || 0) + 1)
    degree.set(e.to, (degree.get(e.to) || 0) + 1)
  }
  const scored = concepts.map(c => ({
    ...c,
    _score: (1 - c.mastery) * 0.6 + Math.min((degree.get(c.id) || 0) / 10, 1) * 0.4,
  }))
  scored.sort((a, b) => b._score - a._score)
  return scored.slice(0, limit)
}

export function GraphMini({ concepts, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!svgRef.current || concepts.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 600
    const height = 220
    const margin = 24

    const top = pickNodes(concepts, edges, 18)
    const topIds = new Set(top.map(c => c.id))
    const degreeMap = new Map<string, number>()
    for (const e of edges) {
      degreeMap.set(e.from, (degreeMap.get(e.from) || 0) + 1)
      degreeMap.set(e.to, (degreeMap.get(e.to) || 0) + 1)
    }

    const filteredEdges = edges.filter(e => topIds.has(e.from) && topIds.has(e.to))

    const simNodes: SimNode[] = top.map(c => ({
      id: c.id, name: c.name, mastery: c.mastery,
      degree: degreeMap.get(c.id) || 0,
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2),
    }))

    const simLinks: SimLink[] = filteredEdges.map(e => ({ source: e.from, target: e.to, type: e.type }))

    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(55))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>(10))
      .force('x', d3.forceX<SimNode>(width / 2).strength(0.02))
      .force('y', d3.forceY<SimNode>(height / 2).strength(0.02))

    // defs for glow
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur')
    const merge = filter.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const g = svg.append('g')

    // Edges
    const link = g.selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', d => d.type === 'prerequisite_of' ? COLOR.prereq : COLOR.edge)
      .attr('stroke-width', d => d.type === 'prerequisite_of' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'related_to' ? '3,2' : '')
      .attr('opacity', 0.6)

    // Nodes group
    const nodeG = g.selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (_e, d) => navigate(`/graph?focus=${d.id}`))

    // Node circles
    nodeG.append('circle')
      .attr('r', d => 5 + d.degree * 0.8)
      .attr('fill', d => d.mastery < 0.3 ? COLOR.low : d.mastery < 0.6 ? COLOR.mid : COLOR.high)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('filter', d => d.mastery < 0.3 ? 'url(#glow)' : '')
      .attr('opacity', d => 0.6 + d.mastery * 0.4)

    // Labels - only for nodes with connections or low mastery
    nodeG.append('text')
      .text(d => d.name.length > 6 ? d.name.slice(0, 5) + '…' : d.name)
      .attr('font-size', 9)
      .attr('text-anchor', 'middle')
      .attr('dy', d => -(7 + (5 + d.degree * 0.8) + 3))
      .attr('fill', '#6b7280')
      .attr('pointer-events', 'none')
      .style('font-weight', d => d.mastery < 0.3 ? '600' : '400')

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', '#1f2937')
      .style('color', '#f9fafb')
      .style('padding', '4px 8px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('opacity', '0')
      .style('transition', 'opacity 0.15s')
      .style('z-index', '100')

    nodeG.on('mouseenter', (_event, d) => {
      tooltip
        .style('opacity', '1')
        .html(`${d.name}<br><span style="color:#9ca3af">掌握度 ${Math.round(d.mastery * 100)}% · ${d.degree} 连接</span>`)
    })
    nodeG.on('mousemove', (event) => {
      tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 30}px`)
    })
    nodeG.on('mouseleave', () => tooltip.style('opacity', '0'))

    // Drag
    nodeG.call(d3.drag<SVGGElement, SimNode>()
      .on('start', (_e, d) => { if (!_e.active) simulation.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (_e, d) => { d.fx = _e.x; d.fy = _e.y })
      .on('end', (_e, d) => { if (!_e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null }) as never)

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimNode).x!).attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!).attr('y2', d => (d.target as SimNode).y!)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [concepts, edges, navigate])

  if (concepts.length === 0) return null

  return (
    <svg ref={svgRef} className="w-full" style={{ height: 220 }} />
  )
}
