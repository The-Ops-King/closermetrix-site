import { motion } from 'framer-motion'

const groups = [
  { label: 'CRM', items: ['GHL', 'HubSpot', 'Close'] },
  { label: 'Recordings', items: ['Zoom', 'Fathom'] },
  { label: 'Notifications', items: ['Slack', 'Email'] },
]

const Integrations = () => {
  return (
    <section id="integrations" className="integrations-section">
      <div className="container">
        <div className="integrations-row">
          {groups.map((group, index) => (
            <motion.div
              key={group.label}
              className="integration-group"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <span className="integration-label">{group.label}</span>
              <div className="integration-items">
                {group.items.map((item) => (
                  <span key={item} className="integration-chip">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Integrations
