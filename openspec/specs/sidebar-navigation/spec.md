## ADDED Requirements

### Requirement: Global sidebar navigation

The system SHALL render a fixed sidebar on the left side of all pages, providing consistent navigation across the application.

#### Scenario: Sidebar visible on every page

- **WHEN** the user navigates to any page (Dashboard, note selection, quiz, graph, resources, settings)
- **THEN** the sidebar is rendered as a fixed left panel with 5 navigation items: Dashboard (→/), 笔记学习 (→/select), 知识图谱 (→/graph), 学习资料 (→/resources), 设置 (→/settings)

#### Scenario: Active route highlighting

- **WHEN** the user is on a specific page
- **THEN** the corresponding sidebar item is highlighted with the accent background color and a left accent border indicator

#### Scenario: Sidebar navigation click

- **WHEN** the user clicks a sidebar item
- **THEN** the browser navigates to the corresponding route without full page reload

#### Scenario: Sidebar items exclude Summary

- **WHEN** the sidebar is rendered
- **THEN** the Summary page is NOT listed as a navigation item

### Requirement: Responsive sidebar behavior

The system SHALL adapt the sidebar for different viewport sizes.

#### Scenario: Desktop viewport

- **WHEN** the viewport width is 768px or wider
- **THEN** the sidebar is rendered as a visible fixed panel (width: 224px / w-56)

#### Scenario: Mobile viewport

- **WHEN** the viewport width is below 768px
- **THEN** the sidebar collapses to a hidden state, accessible via a hamburger menu toggle
