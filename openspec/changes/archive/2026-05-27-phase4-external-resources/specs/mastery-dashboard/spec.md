## ADDED Requirements

### Requirement: Recommended resources section on dashboard

The system SHALL display a "推荐学习资料" section on the Dashboard showing up to 3 unread external resources related to the user's knowledge blind spots.

#### Scenario: Resources available for weak concepts

- **WHEN** the Dashboard loads and the user has concepts with mastery < 0.3 that have matching external resources
- **THEN** up to 3 resource cards are displayed, each showing source domain, title, truncated summary (100 chars), and a "查看" button

#### Scenario: No resources for weak concepts

- **WHEN** the Dashboard loads but no resources match the user's weak concepts
- **THEN** the section displays "暂无推荐资料，知识图谱中的薄弱概念会自动触发推荐"

### Requirement: Manual search from concept node

The system SHALL provide a "查找学习资料" button in the GraphPage concept detail panel that triggers an external resource search for that concept.

#### Scenario: Search from concept detail

- **WHEN** the user clicks "查找学习资料" on a concept detail panel
- **THEN** the system calls `POST /api/resources/search` with the concept ID and displays results in a popover or drawer

#### Scenario: Select a search result

- **WHEN** the user clicks a search result in the popover
- **THEN** the system calls `POST /api/resources/process` for that URL and shows the summary
