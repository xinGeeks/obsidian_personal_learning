## ADDED Requirements

### Requirement: Concept ID in diagnostic blind spots

The system SHALL include `concept_id` in each blind spot diagnostic entry when the source question has associated concept references.

#### Scenario: Blind spot links to concept

- **WHEN** evaluation detects a blind spot for a question with `reference_concepts: ["cn_001"]`
- **THEN** the blind spot object includes `concept_id: "cn_001"` alongside the existing `concept`, `gap_description`, and `suggested_review_notes`

#### Scenario: Blind spot without concept data

- **WHEN** evaluation detects a blind spot but the question has no `reference_concepts`
- **THEN** the blind spot object omits `concept_id` (backward compatible with Phase 2 evaluations)
