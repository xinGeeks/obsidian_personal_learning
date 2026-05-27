## ADDED Requirements

### Requirement: Resource list page at /resources

The system SHALL render a resource library page at `/resources` showing all saved external resources sorted by saved date descending.

#### Scenario: Resources available

- **WHEN** the user navigates to `/resources` and resources exist in `resources.json`
- **THEN** the page displays a list of resource cards, each showing source domain badge, title, summary (200 chars), key points tags, and action buttons

#### Scenario: No resources

- **WHEN** `resources.json` is empty or has no entries
- **THEN** the page displays "暂无学习资料" with a suggestion to explore the knowledge graph

### Requirement: Resource actions

The system SHALL provide three actions per resource: view original article, start quiz, and save note to vault.

#### Scenario: Start quiz from resource

- **WHEN** the user clicks "开始答题" on a resource card
- **THEN** the system loads the resource's quiz questions and navigates to `/quiz` for the standard quiz flow

#### Scenario: Save note from resource

- **WHEN** the user clicks "保存笔记" on a resource card with unsaved note
- **THEN** the system calls `POST /api/resources/save-note` and updates the UI to show "已保存"

### Requirement: Resource search and filter

The system SHALL allow filtering the resource list by searching title and keywords.

#### Scenario: Filter by keyword

- **WHEN** the user types "PCA" in the resource search input
- **THEN** only resources whose title or key_points contain "PCA" are shown

### Requirement: Resource loading and error states

The system SHALL handle loading, empty, and error states for the resource page.

#### Scenario: Loading resources

- **WHEN** the resource list is being fetched
- **THEN** the page shows a loading spinner

#### Scenario: API error

- **WHEN** the resource API returns an error
- **THEN** the page shows an error message with a retry button
