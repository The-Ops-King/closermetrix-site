import { motion } from 'framer-motion'
import SpotlightCard from './SpotlightCard'
import GlareHover from './GlareHover'

const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Automated Call Scoring',
    description: 'AI scores every sales call across 5 components — opening, discovery, pitch, objection handling, and close. The sales coaching scorecard that finally tells you where to focus your coaching time.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    ),
    title: 'Objection Tracking',
    description: 'Automatically track every sales objection by type, by rep, and by outcome. See which objections are hurting your close rate and know exactly how to coach your team through them.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 8v8m-8-5v5m4-8v8M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
      </svg>
    ),
    title: 'Sales Rep Performance Dashboard',
    description: 'Close rates, show rates, revenue per call, and every sales KPI that matters — broken down by rep, offer, and time period. Finally see your close rate benchmarks and who\'s performing.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    title: 'Sales Call Compliance Monitoring',
    description: 'Automatically flags income claims, FTC violations, and SEC compliance risks on every sales call — the compliance monitoring that high-ticket coaching and info-product businesses actually need.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
    title: 'Sales Rep Scorecard & Benchmarking',
    description: 'Compare rep performance side-by-side with a real sales rep scorecard. Identify your top performers, see exactly what they do differently, and replicate it across your team.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    ),
    title: 'Zero-Admin CRM Automation',
    description: 'Connects to your calendar, Zoom, and CRM in minutes. Call outcomes, notes, and objections auto-populate your CRM — eliminate manual data entry and give your team back 45 minutes a day.',
  },
]

const Features = () => {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge cyan">Features</span>
          <h2>AI Sales Coaching Tools That Work <span className="gradient-text">While You Sleep</span></h2>
          <p>CloserMetrix plugs into your existing tools and starts delivering conversation intelligence automatically — so you can coach smarter, not harder.</p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
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
                      {feature.icon}
                    </motion.div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </SpotlightCard>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
