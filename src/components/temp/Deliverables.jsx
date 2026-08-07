import { motion } from 'framer-motion'

/* Grouped by who benefits, not by what the system does. */
const groups = [
  {
    audience: 'CRM',
    outcome: 'A record you can trust',
    items: ['Notes', 'Pain points', 'Goals', 'Objections', 'Next steps'],
  },
  {
    audience: 'Managers',
    outcome: 'Visibility without the listening',
    items: ['Call summary', 'Rubric score', 'Calls worth reviewing'],
  },
  {
    audience: 'Business',
    outcome: 'Evidence that compounds',
    items: ['Weekly Sales Intelligence Report', 'Monthly Sales Integrity Audit', 'Historical trends'],
    featured: true,
  },
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
          <h2>What happens <span className="gradient-text">after every call</span></h2>
        </motion.div>

        <div className="cadence-grid">
          {groups.map((group, index) => (
            <motion.div
              key={group.audience}
              className={`cadence-card ${group.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="cadence-heading">
                <span className="cadence-when">{group.audience}</span>
                <span className="cadence-outcome">{group.outcome}</span>
              </div>
              <ul className="cadence-list">
                {group.items.map((item) => (
                  <li key={item}>
                    <span className="deliverable-check"><Check /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Deliverables
