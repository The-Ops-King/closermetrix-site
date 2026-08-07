import { motion } from 'framer-motion'

const perCall = [
  'CRM Notes',
  'Pain Points',
  'Goals',
  'Objections',
  'Next Steps',
  'Follow-Up Plan',
  'Rubric Score',
  'Manager Summary',
]

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const Deliverables = () => {
  return (
    <section id="deliverables" className="deliverables-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge cyan">The Deliverables</span>
          <h2>What you actually <span className="gradient-text">get back</span></h2>
        </motion.div>

        <motion.p
          className="deliverables-lede"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Every call automatically becomes:
        </motion.p>

        <div className="deliverables-grid">
          {perCall.map((item, index) => (
            <motion.div
              key={item}
              className="deliverable"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.07 }}
            >
              <span className="deliverable-check"><Check /></span>
              {item}
            </motion.div>
          ))}
        </div>

        <div className="cadence-row">
          <motion.div
            className="cadence-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="cadence-when">Every week</span>
            <span className="cadence-what">
              <span className="deliverable-check"><Check /></span>
              Sales Intelligence Report
            </span>
          </motion.div>

          <motion.div
            className="cadence-card featured"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="cadence-when">Every month</span>
            <span className="cadence-what">
              <span className="deliverable-check"><Check /></span>
              Sales Integrity Audit
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Deliverables
