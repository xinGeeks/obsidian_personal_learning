## ADDED Requirements

### Requirement: Fetch and extract article content

The system SHALL fetch the full text content of a given URL using HTTP GET and extract readable text using BeautifulSoup.

#### Scenario: Successfully fetch article

- **WHEN** `POST /api/resources/process` receives a valid URL
- **THEN** the system fetches the HTML, extracts text from `<article>` or `<main>` or `<body>`, and stores the plain text

#### Scenario: Fetch fails

- **WHEN** the HTTP request fails or times out after 15 seconds
- **THEN** the system returns a 502 error with message "Failed to fetch article content" and includes the original URL

### Requirement: AI triple processing (summary + quiz + note)

The system SHALL process fetched article text with three parallel Deepseek calls: generate a summary, generate quiz questions, and generate a Markdown study note.

#### Scenario: Full processing succeeds

- **WHEN** article text is extracted and submitted for processing
- **THEN** the response includes `summary` (300-500 chars), `key_points` (array), `quiz_questions` (3-5 questions in Phase 1 format), and `note_markdown` (full Markdown note)

#### Scenario: Partial processing failure

- **WHEN** one of the three AI calls fails (e.g., quiz generation times out)
- **THEN** the system returns partial results with the failed field set to null and a warning message

### Requirement: Save processed resource

The system SHALL save processed resource metadata and AI-generated content to `.learning/resources.json`.

#### Scenario: Resource saved after processing

- **WHEN** processing completes successfully
- **THEN** a new resource entry is appended to `resources.json` with `id`, `url`, `title`, `source`, `domain_weight`, `summary`, `key_points`, `quiz_questions`, `note_markdown`, `saved_at`, and `reviewed: false`

### Requirement: Save note to vault

The system SHALL write the AI-generated Markdown note to the Obsidian vault at `学习笔记/外部资料/<title>.md` when requested.

#### Scenario: Save note

- **WHEN** `POST /api/resources/save-note` is called with a valid resource_id
- **THEN** the note_markdown is written to the vault and `saved_note_path` is updated in resources.json
