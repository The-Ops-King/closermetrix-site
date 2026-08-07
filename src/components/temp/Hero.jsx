import { motion } from 'framer-motion'
import { GradualBlurText } from '../GradualBlur'
import Dashboard from '../Dashboard'
import StarBorder from '../StarBorder'
import { useDemoModal } from '../../hooks/useDemoModal'

const Hero = () => {
  const { openModal } = useDemoModal()

  const scrollToAudit = (e) => {
    e.preventDefault()
    const target = document.querySelector('#integrity-audit')
    if (target) target.scrollIntoView({ behavior: 'smooth' })
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
          Sales Call Intelligence
        </motion.div>

        <h1>
          <motion.span
            className="hero-title-line"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            The Sales Call Is
          </motion.span>
          <motion.span
            className="hero-title-line gradient-text"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The Biggest Blind Spot
          </motion.span>
          <motion.span
            className="hero-title-line"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            In Your Business
          </motion.span>
        </h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GradualBlurText
            text="Automatically turn every sales call into CRM updates, manager reports, and business insights — so leadership always knows what's actually happening across the sales team."
            delay={0.5}
          />
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <StarBorder color="#00ff88" speed={4} borderRadius="12px">
            <motion.button
              className="btn btn-primary"
              onClick={openModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Book Demo</span>
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
            See Sample Integrity Audit
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        initial={{ opacity: 0, scale: 0.9, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Dashboard />
      </motion.div>
    </section>
  )
}

export default Hero
