## ADDED Requirements

### Requirement: Search external resources by concept

The system SHALL search the web for learning resources using concept names as query terms, returning ranked results with domain-weighted priority.

#### Scenario: Search by concept IDs

- **WHEN** `POST /api/resources/search` receives `concept_ids: ["cn_001", "cn_002"]`
- **THEN** the system constructs search queries from concept names + "学习" suffix and returns top 5 results sorted by domain weight

#### Scenario: Search by custom query

- **WHEN** the request includes `query: "线性代数教程"`
- **THEN** the system uses the custom query directly, bypassing concept name construction

#### Scenario: Empty concept IDs and no query

- **WHEN** neither concept_ids nor query is provided
- **THEN** the system returns a 400 error with message "Missing search terms"

### Requirement: Domain weight prioritization

The system SHALL prioritize search results from high-quality educational domains using a configurable weight table.

#### Scenario: Wikipedia result ranked first

- **WHEN** search returns results from both wikipedia.org (weight 1.0) and an unknown blog (weight 0.5)
- **THEN** the Wikipedia result appears before the blog result regardless of search engine ranking

### Requirement: Search rate limiting

The system SHALL enforce a minimum 3-second interval between consecutive searches to avoid rate limiting.

#### Scenario: Rapid consecutive searches

- **WHEN** two search requests arrive within 2 seconds of each other
- **THEN** the second request waits until 3 seconds have elapsed since the first
