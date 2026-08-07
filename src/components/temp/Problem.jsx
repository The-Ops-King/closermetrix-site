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

        <motion.p
          className="problem-closer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Most businesses lose that information forever. The call ends, the recording sits in a folder,
          and what the buyer actually said never reaches the people making decisions.
        </motion.p>
      </div>
    </section>
  )
}

export default Problem
