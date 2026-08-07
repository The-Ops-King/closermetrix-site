import { motion } from 'framer-motion'

const measured = ['Marketing', 'Revenue', 'Finance', 'Operations']

const unmeasured = [
  'Managers review a handful of calls.',
  'Owners rely on what reps remember.',
  'Marketing guesses what customers care about.',
]

const BlindSpot = () => {
  return (
    <section id="blind-spot" className="blindspot-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Every important business decision <span className="gradient-text">starts in a sales call.</span></h2>
        </motion.div>

        <div className="blindspot-split">
          <motion.div
            className="blindspot-col"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="blindspot-label">Measured</span>
            <ul className="blindspot-list">
              {measured.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="blindspot-col dark"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <span className="blindspot-label warn">Sales conversations</span>
            <ul className="blindspot-list muted">
              {unmeasured.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          className="blindspot-closer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          That creates expensive decisions based on incomplete information.
          <span className="blindspot-fix">CloserMetrix fixes that.</span>
        </motion.p>
      </div>
    </section>
  )
}

export default BlindSpot
