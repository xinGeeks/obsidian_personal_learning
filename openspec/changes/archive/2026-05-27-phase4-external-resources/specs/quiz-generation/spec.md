## ADDED Requirements

### Requirement: Quiz generation from external resource

The system SHALL support generating quiz questions from an external resource URL by fetching its content and using it as quiz context, triggered by `source_type: "resource"` parameter.

#### Scenario: Generate quiz from resource

- **WHEN** `POST /api/quiz/generate` receives `source_type: "resource"` and `source_url: "https://..."`  
- **THEN** the system fetches the article content, processes it with the quiz generation prompt, and returns a quiz with `source_type: "resource"`

#### Scenario: Resource URL fetch fails

- **WHEN** the article at `source_url` cannot be fetched
- **THEN** the system returns a 502 error with message "Failed to fetch resource content"

#### Scenario: Resource quiz stored in memory

- **WHEN** a quiz is generated from a resource
- **THEN** the quiz object includes `source_type: "resource"` and `source_url` fields for downstream evaluation tracking
