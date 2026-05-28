import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { useTheme } from './lib/useTheme'
import { Dashboard } from './pages/Dashboard'
import { GraphPage } from './pages/GraphPage'
import { NoteSelectPage } from './pages/NoteSelectPage'
import { QuizPage } from './pages/QuizPage'
import { ResourcePage } from './pages/ResourcePage'
import { SettingsPage } from './pages/SettingsPage'
import { SummaryPage } from './pages/SummaryPage'

function ConstrainedLayout() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <Outlet />
    </div>
  )
}

function App() {
  const { theme, toggle } = useTheme()

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-bg-base">
        <Sidebar theme={theme} onToggleTheme={toggle} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/graph" element={<GraphPage />} />
            <Route element={<ConstrainedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="resources" element={<ResourcePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="select" element={<NoteSelectPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="summary" element={<SummaryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
