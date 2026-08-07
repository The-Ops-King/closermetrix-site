import { motion } from 'framer-motion'

/*
 * Paired what-you-assumed / what-the-calls-showed. Observations, never
 * recommendations — that distinction is the point of the section.
 */
const examples = [
  {
    before: 'We thought price was the issue.',
    after: 'Implementation concerns appeared three times more often than pricing.',
  },
  {
    before: 'We assumed the team runs the same process.',
    after: 'One closer ran discovery on 94% of calls. Another ran it on 31%.',
  },
  {
    before: 'We thought the new offer landed well.',
    after: 'One objection increased 42% in the three weeks after launch.',
  },
  {
    before: 'We trusted the pipeline stages in the CRM.',
    after: 'A third of calls marked "follow-up booked" had no next step agreed on the call.',
  },
  {
    before: 'We built the ads around our best-known benefit.',
    after: 'Most won deals mentioned a pain point the ads never named.',
  },
]

const DecisionsEnabled = () => {
  return (
    <section id="decisions" className="decisions-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Better information creates <span className="gradient-text">better decisions.</span></h2>
          <p>CloserMetrix doesn't tell you what to do. It helps you understand what's happening.</p>
        </motion.div>

        <ul className="decisions-list">
          {examples.map((example, index) => (
            <motion.li
              key={example.before}
              className="decision-pair"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
            >
              <span className="decision-before">{example.before}</span>
              <span className="decision-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
              <span className="decision-after">{example.after}</span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          className="decisions-note"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          These are observations. Not recommendations.
        </motion.p>
      </div>
    </section>
  )
}

export default DecisionsEnabled
