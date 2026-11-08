/*
  Loader — spinning ring shown during async operations.
  Uses teal tokens which auto-switch between light and dark.
*/

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

function Loader({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`
        inline-block rounded-full animate-spin
        border-teal/20 border-t-teal
        ${SIZES[size]}
        ${className}
      `}
    />
  )
}

export default Loader
