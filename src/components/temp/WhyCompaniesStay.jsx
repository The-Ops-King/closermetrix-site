import { motion } from 'framer-motion'

const effects = [
  { title: 'The dataset compounds', detail: 'Every month of calls makes the patterns clearer than the month before.' },
  { title: 'Marketing improves', detail: 'Messaging gets written from what buyers said, not what someone guessed.' },
  { title: 'Managers trust the CRM', detail: 'The record matches the conversation, because it came from the conversation.' },
  { title: 'Leadership stops guessing', detail: 'Decisions get made against evidence that was already sitting in your calls.' },
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
            The longer you use CloserMetrix
            <span className="headline-break gradient-text">the smarter your business becomes.</span>
          </h2>
        </motion.div>

        <div className="stay-grid">
          {effects.map((effect, index) => (
            <motion.div
              key={effect.title}
              className="stay-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <h3>{effect.title}</h3>
              <p>{effect.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyCompaniesStay
