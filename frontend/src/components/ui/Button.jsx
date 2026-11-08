/*
  Button — the main interactive element used throughout the app.
  primary: solid teal  |  secondary: marigold with dark text
  outline: teal border  |  ghost: teal text, no border
  Three sizes, loading spinner, disabled state.
*/
import Loader from './Loader'

const VARIANTS = {
  primary:
    'bg-teal text-white hover:bg-teal-dark',
  secondary:
    'bg-marigold text-ink hover:bg-marigold-dk',
  outline:
    'border border-teal text-teal hover:bg-teal hover:text-white',
  ghost:
    'text-teal hover:bg-teal/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-colors duration-150 cursor-pointer select-none
        focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <Loader
          size="sm"
          /* White spinner on solid-fill buttons, teal on transparent ones */
          className={
            variant === 'primary' || variant === 'secondary'
              ? 'border-white/30 border-t-white'
              : ''
          }
        />
      )}
      {children}
    </button>
  )
}

export default Button
