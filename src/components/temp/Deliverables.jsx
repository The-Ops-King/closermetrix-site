import { motion } from 'framer-motion'
import CallEvidence from './CallEvidence'

const destinations = [
  {
    who: 'CRM',
    detail: 'The record writes itself.',
    items: ['Notes', 'Pipeline', 'Next Steps', 'Pain Points'],
  },
  {
    who: 'Managers',
    detail: 'What happened, without listening to every call.',
    items: ['Slack Summary', 'Rubric', 'Calls to Review'],
  },
  {
    who: 'Business',
    detail: 'What the calls say, month over month.',
    items: ['Weekly Report', 'Integrity Audit', 'Historical Data'],
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
          <h2>What happens after <span className="gradient-text">every sales call</span></h2>
        </motion.div>

        <motion.div
          className="call-evidence-wrap"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CallEvidence />
        </motion.div>

        <motion.p
          className="destinations-lede"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          That one record then goes three places.
        </motion.p>

        <div className="destinations-grid">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.who}
              className={`destination-card ${destination.featured ? 'featured' : ''}`}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span className="destination-who">{destination.who}</span>
              <span className="destination-detail">{destination.detail}</span>
              <ul className="destination-list">
                {destination.items.map((item) => (
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
