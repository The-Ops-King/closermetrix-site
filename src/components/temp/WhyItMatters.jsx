import { motion } from 'framer-motion'
import SpotlightCard from '../SpotlightCard'

const roles = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
    title: 'Owners',
    description: 'Stop making expensive decisions using incomplete information.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Managers',
    description: 'Know what happened on every sales call without listening to every recording.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 5.882V19.24a1 1 0 01-1.447.894L5 17.882V7.118l4.553-2.276A1 1 0 0111 5.882zM5 7.118H3a2 2 0 00-2 2v6a2 2 0 002 2h2M15 8a5 5 0 010 8M18.5 5a9 9 0 010 14" />
      </svg>
    ),
    title: 'Marketing',
    description: 'See exactly what customers are saying.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'Closers',
    description: 'Never write notes again.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Fulfillment',
    description: 'Know exactly what was promised before onboarding starts.',
  },
]

const WhyItMatters = () => {
  return (
    <section id="why-it-matters" className="why-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Better conversations create <span className="gradient-text">better decisions.</span></h2>
        </motion.div>

        <ul className="why-grid">
          {roles.map((role, index) => (
            <motion.li
              key={role.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
            >
              <SpotlightCard className="feature-card-inner">
                <div className="feature-card-content">
                  <motion.div className="feature-icon" whileHover={{ scale: 1.1, rotate: 5 }}>
                    {role.icon}
                  </motion.div>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                </div>
              </SpotlightCard>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default WhyItMatters
