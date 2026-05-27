## ADDED Requirements

### Requirement: Persist learning session record

The system SHALL save each completed quiz session as a record in a local JSON file, including the generated quiz, all user answers, and evaluations.

#### Scenario: Complete learning session saved

- **WHEN** the user finishes all questions in a quiz
- **THEN** the system appends a session record to `.learning/records.json` containing `session_id`, `quiz_id`, `started_at`, `completed_at`, `questions` array (each with `question`, `user_answer`, `evaluation`), `total_score`, and `source_notes`

#### Scenario: Incomplete session saved

- **WHEN** the user answers some but not all questions and exits
- **THEN** the system saves a session record with `completed_at: null` and `questions` containing only answered questions

### Requirement: Learning records directory isolation

The system SHALL store all learning records in a `.learning/` directory at the vault root, clearly separated from note content.

#### Scenario: Learning directory created on first use

- **WHEN** the first learning record is saved and `.learning/` does not exist
- **THEN** the system creates `.learning/` directory at the vault root

#### Scenario: Records file created on first use

- **WHEN** the first learning record is saved and `records.json` does not exist
- **THEN** the system creates `records.json` with an empty `sessions` array, then appends the new record

### Requirement: Query learning history

The system SHALL allow querying past learning sessions, filtered by date range or source note.

#### Scenario: Query by date range

- **WHEN** the user requests learning records from the past 7 days
- **THEN** the system returns all session records within that date range, sorted by `started_at` descending

#### Scenario: Query by source note

- **WHEN** the user requests learning records related to a specific note
- **THEN** the system returns all session records where `source_notes` includes that note path

#### Scenario: No matching records

- **WHEN** the user queries with filters that match no records
- **THEN** the system returns an empty array

### Requirement: Learning summary aggregation

The system SHALL compute aggregate statistics from learning records: total sessions, average score, and most frequently flagged blind spots.

#### Scenario: Compute learning summary

- **WHEN** the user requests a learning summary
- **THEN** the system returns `total_sessions`, `average_score`, `total_questions_answered`, and `top_blind_spots` (concepts most frequently flagged, sorted by frequency descending)
