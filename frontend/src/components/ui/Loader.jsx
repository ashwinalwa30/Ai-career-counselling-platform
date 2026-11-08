/*
  Loader — a spinning ring shown during async operations (API calls, form submits).
  Used standalone or embedded inside Button's loading state.
*/

// Size classes: border thickness scales with the ring size
const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

/*
  Props:
    size      — 'sm' | 'md' | 'lg'  (default: 'md')
    className — override ring colours (useful inside Button)
*/
function Loader({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`
        inline-block rounded-full animate-spin
        border-brand-indigo/25 border-t-brand-indigo
        dark:border-indigo-700 dark:border-t-indigo-300
        ${SIZES[size]}
        ${className}
      `}
    />
  )
}

export default Loader
