## ADDED Requirements

### Requirement: Batch extraction from vault

The system SHALL extract concepts and relationships from all Markdown notes in the vault by calling Deepseek API for each note, with results merged and deduplicated into the knowledge graph.

#### Scenario: Trigger batch extraction

- **WHEN** `POST /api/graph/trigger-extraction` is called
- **THEN** the system sets `extraction_status.phase` to "running" and begins processing notes asynchronously

#### Scenario: Extraction processes each note

- **WHEN** extraction runs against a vault with 50 notes
- **THEN** each note is sent to Deepseek with a prompt requesting `[{name, description, section, prerequisites, related}]` output

#### Scenario: Extraction already running

- **WHEN** `trigger-extraction` is called while extraction is already "running"
- **THEN** the system returns a 409 error with message "Extraction is already in progress"

### Requirement: Incremental extraction on note change

The system SHALL re-extract concepts only from changed notes and incrementally update the graph (add new concepts, update existing, remove orphaned).

#### Scenario: New note added

- **WHEN** a new note is added to the vault
- **THEN** concepts extracted from it are merged into the graph via the deduplication strategy

#### Scenario: Note deleted

- **WHEN** a note is deleted and its concepts exist in no other source_notes
- **THEN** those concept nodes are removed from the graph

### Requirement: Extraction status tracking

The system SHALL expose extraction progress via `GET /api/graph/extraction-status` returning phase, total_notes_processed, total_notes, and last_extraction timestamp.

#### Scenario: Query extraction progress

- **WHEN** extraction is running with 15 of 50 notes processed
- **THEN** the status returns `{ phase: "running", total_notes_processed: 15, total_notes: 50 }`

#### Scenario: Query after completion

- **WHEN** extraction has completed
- **THEN** the status returns `{ phase: "completed", total_notes_processed: 50, total_notes: 50, last_extraction: "<ISO timestamp>" }`

### Requirement: Extraction error resilience

The system SHALL continue processing remaining notes when a single note's extraction fails, logging the error and skipping that note.

#### Scenario: Single note extraction fails

- **WHEN** Deepseek API returns an error for note 5 of 50
- **THEN** the system logs the error with the note path, skips it, and continues with note 6

### Requirement: Concept detail query

The system SHALL provide `GET /api/graph/concept/{id}` returning the concept's full data: metadata, source notes with titles, related concepts (incoming/outgoing edges), and mastery history.

#### Scenario: Query concept detail

- **WHEN** a valid concept ID is requested
- **THEN** the response includes the concept object plus `incoming_edges` and `outgoing_edges` arrays with the connected concepts' names and relation types
