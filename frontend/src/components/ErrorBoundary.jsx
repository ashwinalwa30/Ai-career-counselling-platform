/*
  ErrorBoundary — catches any unhandled render error in its child tree and
  replaces the blank crash screen with a friendly message.
  Must be a class component: React's error-boundary lifecycle methods
  (getDerivedStateFromError, componentDidCatch) don't exist on function components.
*/
import React   from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  // Called during render when a child throws — update state so the fallback UI shows
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? 'Unknown error' }
  }

  // Called after the render phase — good place for logging
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
          <AlertTriangle size={26} className="text-error" />
        </div>

        <div>
          <h1 className="font-serif text-xl font-semibold text-ink mb-2">
            Something went wrong
          </h1>
          <p className="font-sans text-sm text-muted max-w-xs">
            An unexpected error occurred. Your progress is saved — head back
            to the dashboard to continue.
          </p>
        </div>

        {/* Show the raw message in dev so it's easy to debug */}
        {import.meta.env.DEV && (
          <pre className="text-left text-xs font-mono text-error bg-error/5 border border-error/20 rounded-lg px-4 py-3 max-w-sm w-full overflow-x-auto">
            {this.state.message}
          </pre>
        )}

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal text-white font-sans font-semibold text-sm hover:bg-teal-dark transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    )
  }
}

export default ErrorBoundary
