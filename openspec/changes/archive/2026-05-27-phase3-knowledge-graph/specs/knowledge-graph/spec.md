## ADDED Requirements

### Requirement: Knowledge graph data model

The system SHALL maintain a knowledge graph in `.learning/graph.json` with `concepts` (nodes), `edges` (relationships), and `extraction_status` (pipeline state).

#### Scenario: Graph file initialized

- **WHEN** the graph module loads and `graph.json` does not exist
- **THEN** the system creates it with empty `concepts: {}`, `edges: {}`, and `extraction_status: { phase: "idle", total_notes_processed: 0, total_notes: 0, last_extraction: "" }`

#### Scenario: Concept node contains mastery data

- **WHEN** a concept node is stored
- **THEN** it SHALL include `id`, `name`, `aliases`, `description`, `source_notes`, `mastery`, `confidence`, `total_attempts`, `last_reviewed`, `next_review_due`, and `weak_points`

#### Scenario: Edge contains relationship metadata

- **WHEN** an edge is stored
- **THEN** it SHALL include `from` (concept_id), `to` (concept_id), `type` (one of `prerequisite_of` or `related_to`), `weight` (0.0-1.0), and `label`

### Requirement: Concept deduplication

The system SHALL merge duplicate concepts extracted from different notes using a two-step strategy: name similarity (Levenshtein distance < 3 and shorter name is substring of longer) then embedding cosine similarity (> 0.85).

#### Scenario: Near-identical names merged

- **WHEN** "特征值分解" and "特征值分解法" are extracted
- **THEN** they are merged into a single concept with both source notes

#### Scenario: Semantically same concepts merged via embedding

- **WHEN** "Eigenvalue Decomposition" and "特征值分解" are extracted and name similarity fails
- **THEN** embedding cosine similarity > 0.85 triggers merge

#### Scenario: Distinct concepts kept separate

- **WHEN** "PCA" and "LDA" are extracted and neither name similarity nor embedding similarity thresholds are met
- **THEN** they remain as separate concept nodes

### Requirement: Concept-level mastery tracking

The system SHALL track mastery for each concept independently using the same weighted formula as note-level mastery (0.7 × weighted_historical + 0.3 × latest_score, with 0.9^days decay).

#### Scenario: Quiz updates concept mastery

- **WHEN** a quiz session completes and questions reference concept IDs
- **THEN** each referenced concept's mastery SHALL be updated using the weighted formula

#### Scenario: Concept mastery does not affect note mastery

- **WHEN** concept-level mastery data exists
- **THEN** the note-level `mastery.json` is not automatically overwritten; both data sources coexist

### Requirement: Graph data read/write

The system SHALL provide functions to load/save graph data, upsert concepts, upsert edges, and query the graph by concept ID or source note.

#### Scenario: Load graph from file

- **WHEN** `load_graph()` is called and `graph.json` exists
- **THEN** the full graph object is returned

#### Scenario: Upsert concept

- **WHEN** a concept with an existing ID is upserted with new data
- **THEN** the concept fields are merged (new fields overwrite old, `source_notes` are unioned)
