## ADDED Requirements

### Requirement: Generate mixed-format quiz from selected notes

The system SHALL accept a list of note identifiers and generate a structured quiz containing a mix of multiple-choice, fill-in-the-blank, and short-answer questions by calling Deepseek API with the note contents as context.

#### Scenario: Generate quiz from single note

- **WHEN** the user selects one note and requests quiz generation
- **THEN** the system returns a quiz with at least 3 questions covering different question types (choice, fill-in-blank, short-answer) distributed across the note content

#### Scenario: Generate cross-note quiz

- **WHEN** the user selects 2 or more notes and requests quiz generation
- **THEN** the system returns a quiz where at least one question integrates concepts from multiple selected notes

#### Scenario: Notes too short for quiz

- **WHEN** the combined plain text of selected notes is under 100 characters
- **THEN** the system returns an error with message "Selected notes do not contain enough content for quiz generation"

### Requirement: Quiz response structure

The system SHALL return a quiz as a structured JSON object with a unique quiz identifier, metadata, and an ordered array of questions.

#### Scenario: Quiz structure

- **WHEN** a quiz is successfully generated
- **THEN** the response contains `quiz_id` (UUID), `generated_at` (ISO timestamp), `source_notes` (array of note paths), and `questions` (array of question objects)

#### Scenario: Question structure

- **WHEN** any question is generated
- **THEN** each question object contains `index` (0-based), `type` (one of `choice`, `fill_in_blank`, `short_answer`), `stem` (question text), `options` (array of 4 choices, for `choice` type only), and `reference_notes` (array of note paths this question draws from)

### Requirement: Deepseek API failure handling

The system SHALL handle Deepseek API errors gracefully with clear error messaging.

#### Scenario: API key not configured

- **WHEN** Deepseek API key is missing
- **THEN** the system returns an error with message "AI service not configured" and a 503 status

#### Scenario: API timeout or error

- **WHEN** Deepseek API call fails or times out after 30 seconds
- **THEN** the system returns an error with message "AI service temporarily unavailable, please retry" and a 503 status

### Requirement: Quiz token budget

The system SHALL ensure the combined note content + prompt fits within the Deepseek model's context window.

#### Scenario: Content exceeds token budget

- **WHEN** selected notes exceed 60,000 characters of plain text
- **THEN** the system returns an error with message "Selected notes are too large. Please select fewer notes or shorter content." and a 413 status
