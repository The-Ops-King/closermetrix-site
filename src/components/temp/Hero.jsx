import { motion } from 'framer-motion'
import CallEvidence from './CallEvidence'
import StarBorder from '../StarBorder'
import { useDemoModal } from '../../hooks/useDemoModal'

const outputs = [
  'Accurate CRM updates',
  'Manager visibility',
  'Marketing insights',
  'Business intelligence',
]

const Hero = () => {
  const { openModal } = useDemoModal()

  const scrollToAudit = (e) => {
    e.preventDefault()
    document.querySelector('#integrity-audit')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="pulse"></span>
          The Sales Intelligence Layer for High-Ticket Sales Teams
        </motion.div>

        <h1>
          <motion.span
            className="hero-title-line"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Turn Every Sales Call
          </motion.span>
          <motion.span
            className="hero-title-line"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Into <span className="gradient-text">Better Business Decisions</span>
          </motion.span>
        </h1>

        <motion.p
          className="hero-lede"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          Automatically turn every recorded sales call into:
        </motion.p>

        <motion.ul
          className="hero-outputs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {outputs.map((output) => (
            <li key={output}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {output}
            </li>
          ))}
        </motion.ul>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          So your team spends less time on admin and leadership makes better decisions.
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          <StarBorder color="#00ff88" speed={4} borderRadius="12px">
            <motion.button
              className="btn btn-primary"
              onClick={openModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Book a Demo</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </motion.button>
          </StarBorder>

          <motion.a
            href="#integrity-audit"
            className="btn btn-secondary"
            onClick={scrollToAudit}
            whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            View an Integrity Audit
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, scale: 0.9, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <CallEvidence />
      </motion.div>
    </section>
  )
}

export default Hero
