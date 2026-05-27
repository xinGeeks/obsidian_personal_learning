## ADDED Requirements

### Requirement: List all notes in vault

The system SHALL list all Markdown files in a configured Obsidian vault directory, returning each note's filename, relative path, and title.

#### Scenario: List notes from valid vault

- **WHEN** the user requests the note list and the vault directory exists
- **THEN** the system returns an array of notes, each containing `filename`, `path`, and `title` (extracted from first `# heading` or filename fallback)

#### Scenario: Vault directory not configured

- **WHEN** the vault path is not configured or the directory does not exist
- **THEN** the system returns an error with message "Vault directory not found"

#### Scenario: Empty vault

- **WHEN** the vault directory exists but contains no `.md` files
- **THEN** the system returns an empty array

### Requirement: Read note content

The system SHALL read the full Markdown content of a specified note file, stripping frontmatter and code blocks for AI consumption while preserving the original for display.

#### Scenario: Read existing note

- **WHEN** the user requests content of a valid note path
- **THEN** the system returns the note's `rawContent` (full Markdown) and `plainText` (Markdown with frontmatter, code blocks, and image links removed for AI processing)

#### Scenario: Read non-existent note

- **WHEN** the user requests content of a note path that does not exist
- **THEN** the system returns a 404 error

### Requirement: Parse Obsidian-specific syntax

The system SHALL recognize and correctly parse Obsidian dialect elements including `[[]]` wiki-links, frontmatter blocks, and `#tag` syntax.

#### Scenario: Parse wiki-link

- **WHEN** a note contains `[[Other Note]]`
- **THEN** the system extracts the link target as "Other Note" and makes it available for UI rendering

#### Scenario: Parse frontmatter

- **WHEN** a note contains YAML frontmatter between `---` delimiters
- **THEN** the system extracts key-value pairs as a structured object

#### Scenario: Parse tags

- **WHEN** a note contains `#concept` or frontmatter `tags: [...]`
- **THEN** the system extracts all tags as a deduplicated string array
