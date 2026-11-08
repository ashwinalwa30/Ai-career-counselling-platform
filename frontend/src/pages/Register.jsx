/*
  Register page — placeholder. 3-step form built in Step 4.
*/
import { Link } from 'react-router-dom'

function Register() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-ink">Register</h1>
        <p className="text-muted font-sans text-sm">3-step registration form coming in Step 4.</p>
        <Link to="/" className="text-sm text-teal">← Back to Home</Link>
      </div>
    </div>
  )
}

export default Register
