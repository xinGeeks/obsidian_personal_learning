## ADDED Requirements

### Requirement: Mastery data model

The system SHALL maintain per-note mastery data in `.learning/mastery.json` with fields: `mastery` (0.0-1.0), `confidence`, `total_attempts`, `correct_attempts`, `avg_score`, `last_reviewed`, `next_review_due`, `weak_concepts`, and `ai_assessed_at`.

#### Scenario: Initialize mastery on first quiz

- **WHEN** a quiz session is completed and no mastery entry exists for the source note
- **THEN** the system creates a new mastery entry with `mastery` set to the session score, `total_attempts: 1`, and `next_review_due` computed from the interval mapping

#### Scenario: Update mastery on subsequent quiz

- **WHEN** a quiz session is completed and a mastery entry already exists for the source note
- **THEN** the system recalculates `mastery` using the weighted formula and updates `total_attempts`, `last_reviewed`, and `next_review_due`

### Requirement: Weighted mastery formula

The system SHALL compute mastery as `0.7 × weighted_historical + 0.3 × latest_score`, where `weighted_historical = Σ(score_i × 0.9^days) / Σ(0.9^days)` using all prior session scores for that note.

#### Scenario: Single session calculation

- **WHEN** only one session exists for a note with score 0.8
- **THEN** `mastery = 0.8` (weighted_historical equals the single score, formula averages to the same value)

#### Scenario: Multiple sessions with time decay

- **WHEN** two sessions exist: score 1.0 today and score 0.0 from 10 days ago
- **THEN** `weighted_historical = (1.0 × 1.0 + 0.0 × 0.9^10) / (1.0 + 0.9^10) ≈ 0.74` and `mastery = 0.7 × 0.74 + 0.3 × 1.0 ≈ 0.82`

### Requirement: Review interval mapping

The system SHALL assign `next_review_due` based on mastery level: mastery < 0.3 → 1 day, 0.3-0.6 → 3 days, 0.6-0.8 → 7 days, > 0.8 → 14 days.

#### Scenario: Low mastery short interval

- **WHEN** a note has mastery 0.25 after a session
- **THEN** `next_review_due` is set to `last_reviewed + 1 day`

#### Scenario: High mastery long interval

- **WHEN** a note has mastery 0.85 after a session
- **THEN** `next_review_due` is set to `last_reviewed + 14 days`

### Requirement: AI deep assessment trigger

The system SHALL trigger an AI deep assessment when `total_attempts >= 5` AND `ai_assessed_at` is older than 7 days. The assessment runs asynchronously and does not block the mastery formula update.

#### Scenario: Trigger conditions met

- **WHEN** a note reaches 5 total attempts and last AI assessment was 8 days ago
- **THEN** the system sends the note's full quiz history to Deepseek and updates `weak_concepts` and `mastery` based on the AI response

#### Scenario: Trigger conditions not met

- **WHEN** a note has 3 total attempts or last AI assessment was 3 days ago
- **THEN** the system skips AI assessment and only runs the formula update

### Requirement: Mastery overview API

The system SHALL provide `GET /api/mastery/overview` returning all notes with mastery data, sorted by `mastery` ascending.

#### Scenario: Request mastery overview

- **WHEN** the user requests the mastery overview
- **THEN** the system returns `{ notes: [{ note_path, title, mastery, confidence, total_attempts, last_reviewed, next_review_due, weak_concepts }], overall_mastery: <average> }`

#### Scenario: No mastery data exists

- **WHEN** `mastery.json` is empty or does not exist
- **THEN** the system returns `{ notes: [], overall_mastery: 0.0 }`
