## ADDED Requirements

### Requirement: Full interactive knowledge graph page at /graph

The system SHALL render an interactive force-directed graph at `/graph` using D3.js for force simulation and React for SVG rendering. Nodes represent concepts, edges represent relationships.

#### Scenario: Graph page renders with data

- **WHEN** the user navigates to `/graph` and graph data is available
- **THEN** the page renders concept nodes (circles colored by mastery) and relationship edges (solid for prerequisite_of, dashed for related_to)

#### Scenario: Node click shows detail panel

- **WHEN** the user clicks a concept node
- **THEN** a side panel displays the concept name, description, mastery progress bar, source notes list (linked), and incoming/outgoing related concepts

#### Scenario: Search locates a node

- **WHEN** the user types a concept name in the search box
- **THEN** matching nodes are highlighted and the graph pans to center on the best match

#### Scenario: Zoom and drag

- **WHEN** the user scrolls or drags on the graph canvas
- **THEN** the graph zooms in/out or pans accordingly

### Requirement: Dashboard mini-graph overview

The system SHALL display a compact knowledge graph overview at the bottom of the Dashboard page, showing the top 15 most relevant concept nodes.

#### Scenario: Mini-graph renders on dashboard

- **WHEN** the Dashboard loads and concept data is available
- **THEN** a 200px-tall mini-graph shows up to 15 nodes colored by mastery, with prerequisite edges visible

#### Scenario: Click mini-graph node

- **WHEN** the user clicks a node in the mini-graph
- **THEN** the browser navigates to `/graph?focus=<concept_id>`

#### Scenario: No concept data

- **WHEN** extraction has not yet run and no concepts exist
- **THEN** the mini-graph area shows "知识图谱尚未构建" with a button to trigger extraction

### Requirement: Graph empty and loading states

The system SHALL handle loading, empty, and error states for both graph views.

#### Scenario: Graph data loading

- **WHEN** graph data is being fetched
- **THEN** the page shows a loading spinner

#### Scenario: Graph API error

- **WHEN** the graph API returns an error
- **THEN** the page shows an error message with a retry button
