/*
  Login page — placeholder. Full form built in Step 3.
*/
import { Link } from 'react-router-dom'

function Login() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-ink">Login</h1>
        <p className="text-muted font-sans text-sm">Full login form coming in Step 3.</p>
        <Link to="/" className="text-sm text-teal">← Back to Home</Link>
      </div>
    </div>
  )
}

export default Login
