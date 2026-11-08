// App.jsx — root of the app.
// ThemeProvider wraps everything so any component can read/change the theme.
// GradientBlobs sit behind every page. Add new routes here as pages are built.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import GradientBlobs    from './components/ui/GradientBlobs'
import Home             from './pages/Home'
import UiShowcase       from './pages/UiShowcase'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        {/* Background blobs render once, behind all routes */}
        <GradientBlobs />

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
