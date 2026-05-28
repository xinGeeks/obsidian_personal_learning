## ADDED Requirements

### Requirement: Daily review recommendations section

The system SHALL display a "今日推荐复习" section on the Dashboard showing notes that are due for review, ordered by overdue days descending.

#### Scenario: Review recommendations available

- **WHEN** the user has notes overdue or due for review
- **THEN** the Dashboard displays a list of review recommendation cards, each showing the note title, mastery percentage with color-coded label, review reason, overdue days count, and a "开始复习" action button

#### Scenario: No review recommendations

- **WHEN** the user has no notes due for review
- **THEN** the Dashboard shows a message indicating no review is needed and a prompt to select notes to start learning

### Requirement: Learning calendar heatmap

The system SHALL display a calendar heatmap on the Dashboard showing daily learning activity over a configurable time period, using a green color gradient to encode activity intensity.

#### Scenario: Heatmap renders with data

- **WHEN** the user has learning records from the past 12 months
- **THEN** a grid of day cells is rendered (columns = weeks, rows = days of week), each cell colored from transparent (no activity) through light green to deep green based on the number of learning sessions on that day

#### Scenario: Heatmap cell hover tooltip

- **WHEN** the user hovers over a day cell
- **THEN** a tooltip appears showing the date, number of learning sessions, and number of questions answered that day

#### Scenario: Heatmap with no data

- **WHEN** the user has no learning records
- **THEN** the heatmap renders all cells in the empty (transparent) state, with a message encouraging the user to start their first learning session

#### Scenario: Heatmap month labels

- **WHEN** the heatmap spans multiple months
- **THEN** month names are displayed as column headers above the grid for temporal orientation

### Requirement: Dashboard layout

The system SHALL arrange Dashboard content cards in a responsive grid layout.

#### Scenario: Desktop layout

- **WHEN** the viewport is 1024px or wider
- **THEN** the review recommendations and calendar heatmap are displayed side by side in a two-column grid

#### Scenario: Tablet layout

- **WHEN** the viewport is between 640px and 1023px
- **THEN** the two cards stack vertically in a single column
