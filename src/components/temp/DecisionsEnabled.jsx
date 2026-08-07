import { motion } from 'framer-motion'

/* Observations, not recommendations — that distinction is the point of the section. */
const observations = [
  "Price wasn't actually the biggest objection.",
  'One closer consistently follows the process while another skips discovery.',
  'Marketing is attracting the wrong prospects.',
  'One promise keeps appearing in won deals.',
  'CRM data is incomplete.',
  'Buyers are asking for payment plans twice as often this month.',
  'One objection increased 42% after your last webinar.',
  'Most won deals mention a specific pain point your ads never mention.',
]

const DecisionsEnabled = () => {
  return (
    <section id="decisions" className="decisions-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Better information creates <span className="gradient-text">better decisions.</span></h2>
          <p>
            CloserMetrix doesn't tell you what to do. It helps you understand what's happening.
          </p>
        </motion.div>

        <ul className="decisions-grid">
          {observations.map((observation, index) => (
            <motion.li
              key={observation}
              className="decision-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
            >
              <span className="decision-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {observation}
            </motion.li>
          ))}
        </ul>

        <motion.p
          className="decisions-note"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          These are observations. Not recommendations.
        </motion.p>
      </div>
    </section>
  )
}

export default DecisionsEnabled
