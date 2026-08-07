import { motion } from 'framer-motion'

const Philosophy = () => {
  return (
    <section id="philosophy" className="philosophy-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>
            We don't make decisions.{' '}
            <span className="headline-break gradient-text">We surface evidence.</span>
          </h2>
        </motion.div>

        <motion.p
          className="philosophy-lede"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          CloserMetrix never tells you what to change. It tells you what the calls show.
        </motion.p>

        <div className="philosophy-compare">
          <motion.div
            className="philosophy-card muted"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="philosophy-tag">Instead of saying</span>
            <p>"You should rewrite your script."</p>
          </motion.div>

          <motion.div
            className="philosophy-card"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="philosophy-tag">We say</span>
            <p>"Discovery questions appeared in 91% of won deals."</p>
          </motion.div>
        </div>

        <motion.p
          className="philosophy-closer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          We don't replace your judgment.
          <span className="philosophy-punch">We make your judgment better.</span>
        </motion.p>
      </div>
    </section>
  )
}

export default Philosophy
