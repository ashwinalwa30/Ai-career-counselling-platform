// App.jsx — root of the app.
// Sets up React Router. Each screen lives in its own page component.
// Add new routes here as new pages are built.
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
