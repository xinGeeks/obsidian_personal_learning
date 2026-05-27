## ADDED Requirements

### Requirement: Graph-aware quiz generation

The system SHALL inject relevant concept relationship data (prerequisites, related concepts) into the quiz generation prompt when knowledge graph data is available for the selected notes.

#### Scenario: Generate quiz with graph data

- **WHEN** the user selects notes that have extracted concepts in `graph.json`
- **THEN** the quiz generation prompt includes a "前置概念关系" section listing prerequisite chains relevant to the selected notes

#### Scenario: Generate quiz without graph data

- **WHEN** the user selects notes that have no extracted concepts
- **THEN** the quiz generation falls back to the original prompt (no graph injection), no error raised

### Requirement: Concept ID in question metadata

The system SHALL include extracted concept IDs in each generated question's `reference_concepts` field when graph data is available.

#### Scenario: Question references concepts

- **WHEN** Deepseek generates a question and the system maps the question topic to graph concepts
- **THEN** the question object includes `reference_concepts: ["cn_001", "cn_003"]` alongside the existing `reference_notes`
