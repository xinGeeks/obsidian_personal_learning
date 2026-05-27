## ADDED Requirements

### Requirement: Evaluate single question answer

The system SHALL accept a user's answer for a specific question and return a structured evaluation including correctness, score, and diagnostic feedback by calling Deepseek API.

#### Scenario: Correct multiple-choice answer

- **WHEN** the user selects the correct option for a choice question
- **THEN** the system returns `correct: true`, `score: 1.0`, and a brief confirmation explanation

#### Scenario: Incorrect multiple-choice answer

- **WHEN** the user selects an incorrect option for a choice question
- **THEN** the system returns `correct: false`, `score: 0.0`, an explanation of why the answer is wrong, and the expected correct answer

#### Scenario: Partially correct short-answer

- **WHEN** the user's short-answer response covers some but not all key points
- **THEN** the system returns `correct: false`, `score` between 0.3 and 0.7, and an explanation noting which points were covered and which were missed

### Requirement: Diagnostic feedback with blind spot identification

The system SHALL include in each evaluation a diagnostic section identifying knowledge gaps and recommending specific notes for review.

#### Scenario: Blind spot detected

- **WHEN** the user's answer reveals a knowledge gap related to a concept in a specific note
- **THEN** the diagnostic response contains `blind_spots` array with objects including `concept` (the missed concept), `gap_description` (what the user didn't understand), and `suggested_review_notes` (array of note paths to revisit)

#### Scenario: No blind spot detected

- **WHEN** the user's answer is fully correct and demonstrates solid understanding
- **THEN** the diagnostic response contains `blind_spots: []` and a positive reinforcement message

### Requirement: Evaluation includes reference to source notes

The system SHALL link every diagnosis back to the source notes that contain the relevant knowledge.

#### Scenario: Diagnosis references specific note

- **WHEN** a blind spot relates to a concept covered in "Linear Algebra Chapter 2.md"
- **THEN** the `suggested_review_notes` array includes that specific note path

### Requirement: Evaluation failure handling

The system SHALL handle evaluation API failures without losing the user's answer.

#### Scenario: API call fails during evaluation

- **WHEN** the Deepseek API call for evaluation fails
- **THEN** the system returns an error with the user's submitted answer preserved and a message "Evaluation failed. Your answer has been saved. Please retry." with a 503 status
