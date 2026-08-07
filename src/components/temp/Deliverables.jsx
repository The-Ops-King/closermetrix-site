import { motion } from 'framer-motion'

const cadences = [
  {
    when: 'Every Call',
    items: [
      'CRM Notes',
      'Pain Points',
      'Goals',
      'Objections',
      'Next Steps',
      'Rubric Score',
      'Manager Summary',
    ],
  },
  {
    when: 'Every Week',
    items: ['Sales Intelligence Report'],
  },
  {
    when: 'Every Month',
    items: ['Sales Integrity Audit', 'Historical Trends', 'Business Intelligence'],
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
          <h2>What you actually <span className="gradient-text">get back</span></h2>
        </motion.div>

        <div className="cadence-grid">
          {cadences.map((cadence, index) => (
            <motion.div
              key={cadence.when}
              className={`cadence-card ${cadence.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span className="cadence-when">{cadence.when}</span>
              <ul className="cadence-list">
                {cadence.items.map((item) => (
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
