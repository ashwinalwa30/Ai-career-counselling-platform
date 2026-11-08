/*
  StatsCounter — a horizontal band of four numbers that count up when scrolled
  into view. Uses the useCountUp hook with requestAnimationFrame for a smooth,
  performant animation. Numbers use Indian locale formatting (en-IN).
*/
import { motion } from 'framer-motion'
import useCountUp from '../../hooks/useCountUp'

const STATS = [
  { target: 48500,  suffix: '+',  label: 'Students guided'    },
  { target: 120,    suffix: '+',  label: 'Careers covered'    },
  { target: 210000, suffix: '+',  label: 'Tests completed'    },
  { target: 380,    suffix: '+',  label: 'Schools reached'    },
]

/*
  SingleCounter — isolated so each stat has its own ref and useCountUp instance.
  Putting all four in one component would mean a single ref and a single trigger.
*/
function SingleCounter({ stat, index }) {
  const { count, ref } = useCountUp(stat.target, 1600)

  // Format the number in Indian locale: 2,10,000 not 210,000
  const formatted = new Intl.NumberFormat('en-IN').format(count)

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center gap-2 py-4"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
    >
      {/* The big animated number */}
      <p className="font-serif text-4xl sm:text-5xl font-semibold text-teal leading-none">
        {formatted}{stat.suffix}
      </p>

      <p className="text-sm text-muted font-sans">{stat.label}</p>
    </motion.div>
  )
}

function StatsCounter() {
  return (
    <section className="bg-paper border-t border-b border-edge py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0 md:divide-x md:divide-edge">
          {STATS.map((stat, i) => (
            <SingleCounter key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsCounter
