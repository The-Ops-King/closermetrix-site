import { motion } from 'framer-motion'

const contents = [
  'Objections',
  'Buyer language',
  'Customer goals',
  'Why deals were won',
  'Why deals were lost',
]

const Problem = () => {
  return (
    <section id="problem" className="problem-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>
            Sales conversations generate revenue.{' '}
            <span className="headline-break gradient-text">But most businesses throw them away.</span>
          </h2>
        </motion.div>

        <motion.p
          className="problem-lede"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Every call contains:
        </motion.p>

        <ul className="problem-cards">
          {contents.map((item, index) => (
            <motion.li
              key={item}
              className="problem-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              {item}
            </motion.li>
          ))}
        </ul>

        <motion.div
          className="problem-ending"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="problem-ending-lead">When the call ends&hellip;</p>
          <ul className="problem-ending-list">
            <li>The customer leaves.</li>
            <li>The recording gets archived.</li>
            <li>The CRM gets incomplete notes.</li>
          </ul>
          <p className="problem-ending-punch">
            Leadership loses the most valuable information in the business.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Problem
