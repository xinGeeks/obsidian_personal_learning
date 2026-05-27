## ADDED Requirements

### Requirement: Concept-level mastery tracking

The system SHALL apply the same weighted mastery formula to individual concepts, updating `graph.json` concept mastery when quiz questions reference concept IDs.

#### Scenario: Quiz updates concept mastery

- **WHEN** a quiz session completes and question evaluations reference concept IDs
- **THEN** each referenced concept in `graph.json` has its mastery recalculated using the weighted formula

#### Scenario: Concept mastery and note mastery coexist

- **WHEN** concept-level mastery data exists in `graph.json`
- **THEN** the original note-level `mastery.json` is preserved; Dashboard APIs prefer concept data and fall back to note data

## MODIFIED Requirements

### Requirement: Mastery overview API

The system SHALL provide `GET /api/mastery/overview` returning all notes with mastery data, sorted by `mastery` ascending. When concept-level data exists in `graph.json`, the response SHALL include aggregated concept-level statistics.

#### Scenario: Request mastery overview with concept data

- **WHEN** the user requests the mastery overview and `graph.json` has concept data
- **THEN** the system returns `{ notes: [...], overall_mastery: <average>, concepts_summary: { total_concepts: N, lowest_mastery_concepts: [...] } }`

#### Scenario: No mastery data exists

- **WHEN** `mastery.json` is empty and `graph.json` has no concepts
- **THEN** the system returns `{ notes: [], overall_mastery: 0.0, concepts_summary: { total_concepts: 0, lowest_mastery_concepts: [] } }`
