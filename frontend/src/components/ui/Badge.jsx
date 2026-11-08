/*
  Badge — a small pill label for status, categories, or tags.
  Uses semantic colour tokens; all variants auto-switch in dark mode.
*/

const VARIANTS = {
  default:  'bg-teal/10 text-teal border border-teal/20',
  success:  'bg-success/10 text-success border border-success/20',
  warning:  'bg-marigold/10 text-marigold border border-marigold/20',
  error:    'bg-error/10 text-error border border-error/20',
  neutral:  'bg-edge text-muted border border-edge',
}

function Badge({ variant = 'default', className = '', children }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        rounded-full text-xs font-semibold tracking-wide
        ${VARIANTS[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export default Badge
