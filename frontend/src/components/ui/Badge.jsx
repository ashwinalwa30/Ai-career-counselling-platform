/*
  Badge — a small pill label for status, categories, or tags.
  Five colour variants map to the design system's semantic colours.
*/

const VARIANTS = {
  default: 'bg-indigo-100 text-brand-indigo dark:bg-indigo-950/60 dark:text-indigo-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  error:   'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

/*
  Props:
    variant   — 'default' | 'success' | 'warning' | 'error' | 'neutral'
    className — extra Tailwind classes
    children  — text label
*/
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
