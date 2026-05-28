## ADDED Requirements

### Requirement: Dark color token system

The system SHALL define a unified dark color palette via Tailwind CSS v4 `@theme` directives, applied globally across all pages.

#### Scenario: Multi-level dark backgrounds

- **WHEN** any page is rendered
- **THEN** the page base background uses the deepest dark color (`bg-base`), content cards use a slightly lighter dark blue-gray (`bg-card`), and hover or focused elements use the lightest dark shade (`bg-hover`)

#### Scenario: Accent color usage

- **WHEN** buttons, selected states, focus borders, or primary interactive elements are rendered
- **THEN** they use the low-saturation indigo/violet-blue accent color (`#5B6EF5`) as their primary color

#### Scenario: Semantic functional colors

- **WHEN** the UI displays positive states (success, correct answer) or negative states (error, risk, incorrect answer)
- **THEN** green (`#34D399`) is used for positive and red (`#F87171`) for negative, following financial dashboard conventions

#### Scenario: Text hierarchy

- **WHEN** any page renders text content
- **THEN** primary text uses light white (`#E8ECF1`), and secondary labels and descriptions use a muted gray (`#8B949E`)

#### Scenario: Card borders

- **WHEN** a content card is rendered
- **THEN** its border is a thin line at very low opacity white (`rgba(255,255,255,0.06)`), creating subtle separation without visual fragmentation

### Requirement: Card component style consistency

The system SHALL apply a consistent card style pattern across all card-like UI elements throughout the application.

#### Scenario: Card default state

- **WHEN** any content card is displayed
- **THEN** it has a rounded corner (`rounded-xl`), the card background color (`bg-card`), and a thin transparent border (`border border-border-card`)

#### Scenario: Card hover state

- **WHEN** the user hovers over an interactive card
- **THEN** the card background subtly lightens and the border emits a faint accent glow, with a smooth transition duration of approximately 200ms

#### Scenario: Card internal layout

- **WHEN** a card contains data content
- **THEN** its internal layout follows a top-to-bottom hierarchy: small title/label at top, large core data in the middle, auxiliary trend or ratio info at the bottom

### Requirement: All existing pages adapt to dark theme

The system SHALL update all existing pages to use dark theme colors instead of their current light theme styles.

#### Scenario: Quiz page in dark theme

- **WHEN** the quiz page is displayed
- **THEN** question stems, option buttons, text inputs, and evaluation displays all render with sufficient contrast against the dark background

#### Scenario: Settings page in dark theme

- **WHEN** the settings page is displayed
- **THEN** form inputs, labels, and controls use dark-appropriate colors with readable text contrast

#### Scenario: Graph page in dark theme

- **WHEN** the knowledge graph page is displayed
- **THEN** graph nodes and edges are visible against the dark background, and any text labels are readable
