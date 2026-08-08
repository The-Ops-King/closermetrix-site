import { motion } from 'framer-motion'

const effects = [
  { title: 'Your historical dataset grows', detail: 'Every month adds to the record, so the patterns get clearer than the month before.' },
  { title: 'Marketing learns more', detail: 'Messaging gets written from what buyers said, not what someone guessed.' },
  { title: 'Managers gain confidence', detail: 'The record matches the conversation, because it came from the conversation.' },
  { title: 'Leadership spots trends earlier', detail: 'Shifts show up in the data before they show up in the revenue.' },
]

const WhyCompaniesStay = () => {
  return (
    <section id="why-stay" className="stay-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>
            The longer you use CloserMetrix,{' '}
            <span className="headline-break gradient-text">the smarter your business becomes.</span>
          </h2>
        </motion.div>

        <ul className="stay-grid">
          {effects.map((effect, index) => (
            <motion.li
              key={effect.title}
              className="stay-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <h3>{effect.title}</h3>
              <p>{effect.detail}</p>
            </motion.li>
          ))}
        </ul>

        <motion.p
          className="stay-closer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          The value compounds over time.
        </motion.p>
      </div>
    </section>
  )
}

export default WhyCompaniesStay
