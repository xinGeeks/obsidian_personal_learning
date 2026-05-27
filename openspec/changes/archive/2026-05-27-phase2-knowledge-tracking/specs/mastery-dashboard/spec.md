## ADDED Requirements

### Requirement: Dashboard as new home page

The system SHALL render the mastery dashboard at route `/` showing today's review recommendations and the mastery overview for all notes with learning history.

#### Scenario: User lands on dashboard

- **WHEN** the user navigates to `/`
- **THEN** the page displays two sections: "今日推荐复习" at top and "全部笔记掌握度" below

### Requirement: Recommendation cards section

The system SHALL display each recommendation as a card showing note title, mastery percentage with color indicator, recommendation reason, and a "开始复习" button.

#### Scenario: Recommendations available

- **WHEN** recommendations are loaded with 3 items
- **THEN** the page shows 3 recommendation cards, each with a mastery indicator (red < 0.3, yellow 0.3-0.6, green > 0.6), the AI-generated reason, and a button to start reviewing that note

#### Scenario: No recommendations

- **WHEN** no notes are due for review
- **THEN** the section displays "当前没有需要复习的内容" and suggests learning new notes via the `/select` link

### Requirement: Mastery overview section

The system SHALL display all notes with learning history as a list of progress bars showing note title, mastery percentage, and weak concepts.

#### Scenario: Notes with mastery data

- **WHEN** 5 notes have mastery data
- **THEN** each note shows a labeled progress bar (note title + mastery%) with color gradient from red to green based on mastery value

#### Scenario: No mastery data

- **WHEN** no notes have mastery data (new user)
- **THEN** the section displays a prompt to complete the first quiz session to start tracking

### Requirement: Navigation to note selection

The system SHALL provide a link or button to navigate to `/select` for choosing notes not yet tracked by the mastery system.

#### Scenario: User wants to learn new content

- **WHEN** the user clicks "选择其他笔记学习"
- **THEN** the system navigates to `/select` showing the full vault note list
