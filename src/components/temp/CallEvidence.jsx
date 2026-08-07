import { motion } from 'framer-motion'

/*
 * Hero visual: what one recorded call turns into. Deliberately shows the
 * extracted evidence rather than a metrics screen.
 */
const rows = [
  {
    label: 'Pain point',
    value: '"We\'re booking calls but nothing closes past week two."',
  },
  {
    label: 'Goal',
    value: '"Get to 40 closes a month without hiring two more reps."',
  },
  {
    label: 'Objection',
    value: 'Price — raised at 31:04, not resolved',
    tone: 'warn',
  },
  {
    label: 'Next step',
    value: 'Proposal + payment options sent by Thursday',
  },
]

const CallEvidence = () => (
  <motion.div className="evidence-card" whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
    <div className="evidence-header">
      <span className="evidence-source">One recorded call</span>
      <span className="evidence-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
      <span className="evidence-target">Structured record</span>
    </div>

    <div className="evidence-rows">
      {rows.map((row, index) => (
        <motion.div
          key={row.label}
          className="evidence-row"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
        >
          <span className={`evidence-label ${row.tone || ''}`}>{row.label}</span>
          <span className="evidence-value">{row.value}</span>
        </motion.div>
      ))}
    </div>

    <motion.div
      className="evidence-footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1 }}
    >
      <span className="evidence-check">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      Written to the CRM. Manager notified. No one typed a word.
    </motion.div>

    <div className="dashboard-glow" />
  </motion.div>
)

export default CallEvidence
