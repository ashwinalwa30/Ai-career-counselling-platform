/*
  Card — a rounded container for grouping related content.
  Optional "glass" prop applies the glassmorphism style (backdrop blur + translucent bg).
  Optional "hover" prop adds a lift effect on mouse-over (great for clickable cards).
*/

/*
  Props:
    glass     — boolean: use glassmorphism surface instead of solid white/dark
    hover     — boolean: add hover lift + shadow animation
    className — extra Tailwind classes
    children
*/
function Card({ glass = false, hover = false, className = '', children }) {
  const base = 'rounded-2xl p-6'

  const surface = glass
    ? 'glass'
    : 'bg-white dark:bg-navy-800 border border-slate-100 dark:border-slate-700/50 shadow-sm'

  const hoverStyle = hover
    ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-100/40 dark:hover:shadow-indigo-900/30 cursor-pointer'
    : ''

  return (
    <div className={`${base} ${surface} ${hoverStyle} ${className}`}>
      {children}
    </div>
  )
}

export default Card
