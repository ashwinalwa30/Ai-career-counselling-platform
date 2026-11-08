// App.jsx — root of the app.
// ThemeProvider supplies light/dark switching to every component.
// Add new routes here as new pages are built.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import Home        from './pages/Home'
import UiShowcase  from './pages/UiShowcase'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"   element={<Home />} />
          {/* Temporary route: remove before final handoff */}
          <Route path="/ui" element={<UiShowcase />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
