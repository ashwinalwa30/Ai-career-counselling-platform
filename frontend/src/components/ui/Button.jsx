/*
  Button — the main interactive element used throughout the app.
  Supports four visual variants, three sizes, a loading spinner, and disabled state.
*/
import Loader from './Loader'

// Tailwind classes for each variant
const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-sm hover:shadow-indigo-200/60 hover:shadow-md hover:-translate-y-0.5 dark:hover:shadow-indigo-900/60',
  secondary:
    'bg-brand-amber text-white shadow-sm hover:shadow-amber-200/60 hover:shadow-md hover:-translate-y-0.5',
  outline:
    'border-2 border-brand-indigo text-brand-indigo hover:bg-brand-indigo hover:text-white dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:border-indigo-500 dark:hover:text-white',
  ghost:
    'text-brand-indigo hover:bg-brand-indigo/10 dark:text-indigo-400 dark:hover:bg-indigo-400/10',
}

// Tailwind classes for each size
const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
}

/*
  Props:
    variant  — 'primary' | 'secondary' | 'outline' | 'ghost'  (default: 'primary')
    size     — 'sm' | 'md' | 'lg'                              (default: 'md')
    loading  — boolean: shows spinner and blocks interaction
    disabled — boolean
    className — extra Tailwind classes
    children — button label / content
    ...rest  — anything else (onClick, type, aria-*, etc.)
*/
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
        transition-all duration-200 cursor-pointer select-none
        focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${VARIANTS[variant]}
        ${SIZES[size]}
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <Loader
          size="sm"
          // On primary/secondary the spinner should be white
          className={variant === 'primary' || variant === 'secondary' ? 'border-white/30 border-t-white' : ''}
        />
      )}
      {children}
    </button>
  )
}

export default Button
