import { motion } from 'framer-motion'
import SpotlightCard from './SpotlightCard'

const items = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'No End-of-Day Forms',
    description: 'Closers hate filling out call disposition forms — and most skip them anyway. CloserMetrix captures everything automatically from the call itself. No reminders. No nagging. No gaps in your data.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Kill the CRM Busywork',
    description: 'Stop asking your closers to log notes, tag outcomes, and update fields after every call. We pull it straight from the recording — automatically, accurately, every time.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'More Calls, Less Admin',
    description: 'Every minute a closer spends on admin is a minute they\'re not on the phone. We give that time back — so they can take more calls and close more deals instead of doing data entry.',
  },
]

const ZeroAdmin = () => {
  return (
    <section className="zero-admin-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge cyan">Zero Admin</span>
          <h2>Stop Babysitting <span className="gradient-text">Your Closers' Paperwork</span></h2>
          <p>You shouldn't have to trust them to fill out forms — or waste time reminding them. We handle it.</p>
        </motion.div>

        <div className="zero-admin-grid">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <SpotlightCard className="feature-card-inner">
                <div className="feature-card-content">
                  <motion.div
                    className="feature-icon"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ZeroAdmin
