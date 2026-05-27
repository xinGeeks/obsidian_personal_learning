import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { GraphPage } from './pages/GraphPage'
import { NoteSelectPage } from './pages/NoteSelectPage'
import { QuizPage } from './pages/QuizPage'
import { ResourcePage } from './pages/ResourcePage'
import { SettingsPage } from './pages/SettingsPage'
import { SummaryPage } from './pages/SummaryPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/resources" element={<ResourcePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/select" element={<NoteSelectPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
