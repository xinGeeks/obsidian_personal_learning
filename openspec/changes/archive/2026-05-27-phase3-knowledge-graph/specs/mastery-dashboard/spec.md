## ADDED Requirements

### Requirement: Mini knowledge graph on dashboard

The system SHALL display a compact knowledge graph overview at the bottom of the Dashboard page, showing up to 15 concept nodes from `graph.json`.

#### Scenario: Mini-graph with data

- **WHEN** the Dashboard loads and `graph.json` has concept data
- **THEN** a 200px-tall force-directed mini-graph renders, nodes colored by mastery level, edges shown for prerequisite relationships

#### Scenario: Click mini-graph node navigates to full graph

- **WHEN** the user clicks a node in the mini-graph
- **THEN** the browser navigates to `/graph?focus=<concept_id>`

#### Scenario: No concept data yet

- **WHEN** `graph.json` has no concepts
- **THEN** the mini-graph area displays "知识图谱尚未构建" with a button labeled "开始构建知识图谱" that calls `POST /api/graph/trigger-extraction`
