import { motion } from 'framer-motion'

/* Observations, not recommendations — that distinction is the point of the section. */
const shifts = [
  {
    before: 'We think price is the issue.',
    after: 'Price appeared in only 14% of lost deals.',
  },
  {
    before: 'We think Bob is our best closer.',
    after: 'Sarah follows the sales process 96% of the time.',
  },
  {
    before: "We think marketing is attracting the wrong people.",
    after: 'Most won deals mention implementation speed.',
  },
  {
    before: 'We think the new offer is landing.',
    after: 'One objection increased 42% after the last webinar.',
  },
  {
    before: 'We think the CRM is current.',
    after: '1 in 3 closed calls had no next step recorded.',
  },
  {
    before: 'We think buyers want a discount.',
    after: 'Payment plan requests doubled this month.',
  },
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
          <p>CloserMetrix doesn't tell you what to do. It helps you understand what's happening.</p>
        </motion.div>

        <ul className="shifts">
          {shifts.map((shift, index) => (
            <motion.li
              key={shift.before}
              className="shift"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
            >
              <span className="shift-side before">
                <span className="shift-tag">Before</span>
                <span className="shift-text">"{shift.before}"</span>
              </span>

              <span className="shift-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>

              <span className="shift-side after">
                <span className="shift-tag">After</span>
                <span className="shift-text">{shift.after}</span>
              </span>
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
