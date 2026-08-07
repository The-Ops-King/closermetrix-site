import { motion } from 'framer-motion'

const steps = [
  { title: 'Record the call', detail: 'Your team keeps working the way it already works.' },
  { title: 'CloserMetrix extracts structured data', detail: 'What was said, what was raised, what was agreed.' },
  { title: 'CRM updates automatically', detail: 'Notes, fields and next steps written without anyone typing.' },
  { title: 'Managers get reports', detail: 'What happened on every call, without listening to every call.' },
  { title: 'Marketing gets customer intelligence', detail: 'The language buyers actually use, in their words.' },
  { title: 'Leadership gets monthly Integrity Audits', detail: 'What changed, what worked, what deserves attention.' },
]

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge">How It Works</span>
          <h2>Six steps. <span className="gradient-text">None of them yours.</span></h2>
        </motion.div>

        <ol className="chain">
          {steps.map((step, index) => (
            <motion.li
              key={step.title}
              className="chain-step"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <span className="chain-index">{index + 1}</span>
              <div className="chain-body">
                <span className="chain-title">{step.title}</span>
                <span className="chain-detail">{step.detail}</span>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
