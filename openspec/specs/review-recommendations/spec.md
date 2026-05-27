## ADDED Requirements

### Requirement: Due review detection

The system SHALL identify notes whose `next_review_due` timestamp is at or before the current time.

#### Scenario: Note is overdue for review

- **WHEN** a note has `next_review_due` of 2 days ago
- **THEN** the note is included in the due reviews list

#### Scenario: Note is not yet due

- **WHEN** a note has `next_review_due` of 3 days from now
- **THEN** the note is excluded from the due reviews list

### Requirement: Recommendation ranking

The system SHALL sort due review notes by priority score `(1 - mastery) × (1 + overdue_days / 7)` in descending order.

#### Scenario: Two overdue notes with different mastery

- **WHEN** Note A has mastery 0.3 overdue by 1 day, and Note B has mastery 0.7 overdue by 5 days
- **THEN** Note A priority = 0.7 × 1.14 = 0.80, Note B priority = 0.3 × 1.71 = 0.51, so Note A ranks first

### Requirement: AI-generated recommendation reason

The system SHALL generate a one-sentence recommendation reason for each due review note using Deepseek, based on the note's weak concepts and recent quiz performance.

#### Scenario: Generate recommendation reasons

- **WHEN** requesting recommendations
- **THEN** each recommendation item includes a `reason` field with a personalized recommendation sentence

#### Scenario: AI unavailable for recommendations

- **WHEN** Deepseek API call for recommendation reasons fails
- **THEN** each recommendation item includes a default reason based on the note's mastery level and last reviewed date

### Requirement: Recommendations API

The system SHALL provide `GET /api/mastery/recommendations` returning due review notes ranked by priority.

#### Scenario: Request recommendations

- **WHEN** the user requests recommendations
- **THEN** the system returns `{ items: [{ note_path, title, mastery, overdue_days, priority, reason }] }` sorted by priority descending

#### Scenario: No due reviews

- **WHEN** no notes are due for review
- **THEN** the system returns `{ items: [], message: "当前没有需要复习的内容" }`
