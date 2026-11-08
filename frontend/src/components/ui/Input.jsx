/*
  Input — a labelled text field with optional left icon and error message.
  Always requires an "id" prop so the label's "for" attribute links correctly
  (this is important for screen-reader accessibility).
*/

/*
  Props:
    label     — string: visible label above the field
    id        — string: links <label> to <input> for accessibility
    icon      — a Lucide icon component (e.g. Mail, Lock) shown on the left
    error     — string: error message shown in rose below the field
    className — extra classes on the <input> element
    ...rest   — any native input prop: type, placeholder, value, onChange, etc.
*/
function Input({ label, id, icon: Icon, error, className = '', ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Label — clicking it focuses the input because htmlFor matches id */}
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input wrapper — relative so the icon can be absolutely positioned */}
      <div className="relative">
        {Icon && (
          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          >
            <Icon size={16} />
          </span>
        )}

        <input
          id={id}
          className={`
            w-full rounded-xl border text-sm
            px-4 py-2.5
            ${Icon ? 'pl-9' : ''}
            bg-white dark:bg-navy-800
            text-slate-800 dark:text-slate-200
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            transition duration-150
            focus:outline-none focus:ring-2
            ${error
              ? 'border-brand-rose focus:ring-brand-rose/25 focus:border-brand-rose'
              : 'border-slate-200 dark:border-slate-700 focus:ring-brand-indigo/25 focus:border-brand-indigo'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      </div>

      {/* Error message — linked to the input via aria-describedby */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-brand-rose">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
