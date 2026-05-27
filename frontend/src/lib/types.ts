export interface NoteInfo {
  filename: string
  path: string
  title: string
}

export interface ChoiceQuestion {
  type: 'choice'
  stem: string
  options: string[]
  answer?: string
  explanation?: string
  reference_notes: string[]
}

export interface FillInBlankQuestion {
  type: 'fill_in_blank'
  stem: string
  answer?: string
  explanation?: string
  reference_notes: string[]
}

export interface ShortAnswerQuestion {
  type: 'short_answer'
  stem: string
  answer?: string
  explanation?: string
  reference_notes: string[]
}

export type Question = ChoiceQuestion | FillInBlankQuestion | ShortAnswerQuestion

export interface Quiz {
  quiz_id: string
  generated_at: string
  source_notes: string[]
  questions: Question[]
}

export interface BlindSpot {
  concept: string
  gap_description: string
  suggested_review_notes: string[]
}

export interface Diagnostic {
  blind_spots: BlindSpot[]
  summary: string
}

export interface Evaluation {
  correct: boolean
  score: number
  explanation: string
  correct_answer?: string
  diagnostic: Diagnostic
}

export interface SessionRecord {
  session_id: string
  quiz_id: string
  started_at: string
  completed_at: string | null
  questions: {
    question: Question
    user_answer: string
    evaluation: Evaluation | null
  }[]
  total_score: number | null
  source_notes: string[]
}

export interface LearningSummary {
  total_sessions: number
  average_score: number
  total_questions_answered: number
  top_blind_spots: { concept: string; count: number }[]
}

export interface MasteryEntry {
  note_path: string
  title: string
  mastery: number
  confidence: number
  total_attempts: number
  last_reviewed: string
  next_review_due: string
  weak_concepts: string[]
}

export interface MasteryOverview {
  notes: MasteryEntry[]
  overall_mastery: number
}

export interface RecommendationItem {
  note_path: string
  title: string
  mastery: number
  overdue_days: number
  priority: number
  weak_concepts: string[]
  reason: string
}

export interface ConceptNode {
  id: string
  name: string
  aliases: string[]
  description: string
  source_notes: string[]
  mastery: number
  confidence: number
  total_attempts: number
  last_reviewed: string
  next_review_due: string
  weak_points: string[]
}

export interface ConceptEdge {
  id: string
  from: string
  to: string
  type: 'prerequisite_of' | 'related_to'
  weight: number
  label: string
}

export interface GraphData {
  concepts: ConceptNode[]
  edges: ConceptEdge[]
}

export interface ExtractionStatus {
  phase: 'idle' | 'running' | 'completed'
  total_notes_processed: number
  total_notes: number
  last_extraction: string
}

export interface ConceptDetail extends ConceptNode {
  related_concepts: {
    id: string
    name: string
    relation_type: string
    relation_label: string
  }[]
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  domain_weight: number
  score: number
}

export interface ResourceItem {
  id: string
  url: string
  title: string
  source: string
  domain_weight: number
  related_concepts: string[]
  summary: string
  key_points: string[]
  quiz_questions: Question[]
  note_markdown: string
  saved_note_path: string
  saved_at: string
  reviewed: boolean
}
