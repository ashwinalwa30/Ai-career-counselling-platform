/*
  Card — a solid-surface container for grouping related content.
  Default: white/dark-surface background, 1px border, small shadow.
  glass: warm-tinted backdrop-blur (used sparingly, e.g. scrolled navbar).
  hover: subtle lift on mouse-over for clickable cards.
*/
function Card({ glass = false, hover = false, className = '', children }) {
  const surface = glass
    ? 'glass'
    : 'bg-surface border border-edge shadow-sm'

  const hoverStyle = hover
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
    : ''

  return (
    <div className={`rounded-lg p-6 ${surface} ${hoverStyle} ${className}`}>
      {children}
    </div>
  )
}

export default Card
