/*
  Input — labelled text field with optional left icon and inline error message.
  The "id" prop is required so the <label> and error <p> link to the input
  via htmlFor / aria-describedby, which is important for screen readers.
*/
function Input({ label, id, icon: Icon, error, className = '', ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <Icon size={15} />
          </span>
        )}

        <input
          id={id}
          className={`
            w-full rounded-lg border bg-surface text-ink text-sm
            px-3.5 py-2.5
            ${Icon ? 'pl-9' : ''}
            placeholder:text-muted
            transition duration-150
            focus:outline-none focus:ring-2
            ${error
              ? 'border-error focus:ring-error/20 focus:border-error'
              : 'border-edge focus:ring-teal/20 focus:border-teal'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
