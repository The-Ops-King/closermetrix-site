import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDemoModal } from '../../hooks/useDemoModal'

/*
 * Drop real audit screenshots at public/integrity-audit-1.png (large, top) and
 * public/integrity-audit-2.png / -3.png (the two below) and they replace the
 * mocks automatically. Missing files fall back to the mock renderings.
 */
const Shot = ({ src, alt, className, children }) => {
  const [ok, setOk] = useState(true)
  if (!ok) return children
  return <img src={src} alt={alt} className={className} onError={() => setOk(false)} />
}

const highlights = ["What's changing", "What's working", "What's breaking", 'What deserves attention']

const AuditMock = () => {
  const bars = [72, 88, 61, 94, 55, 79, 68]
  const reps = [
    { name: 'Sarah', score: 96, tone: 'good' },
    { name: 'Priya', score: 84, tone: 'good' },
    { name: 'Bob', score: 71, tone: 'warn' },
    { name: 'Marcus', score: 54, tone: 'bad' },
  ]

  return (
    <div className="audit-mock">
      <div className="audit-mock-header">
        <div className="dashboard-dots">
          <span style={{ background: '#ff5f57' }}></span>
          <span style={{ background: '#febc2e' }}></span>
          <span style={{ background: '#28c840' }}></span>
        </div>
        <span className="dashboard-title">Sales Integrity Audit — March</span>
      </div>

      <div className="audit-mock-body">
        <div className="audit-mock-stats">
          <div className="audit-stat">
            <span className="audit-stat-label">Process followed</span>
            <span className="audit-stat-value">78%</span>
            <span className="audit-stat-change positive">+6 pts vs February</span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat-label">CRM accuracy</span>
            <span className="audit-stat-value">94%</span>
            <span className="audit-stat-change positive">+21 pts vs February</span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat-label">Top reason for no</span>
            <span className="audit-stat-value sm">Price</span>
            <span className="audit-stat-change">14% of lost deals</span>
          </div>
        </div>

        <div className="audit-mock-panels">
          <div className="audit-panel">
            <span className="audit-panel-title">Process followed, by month</span>
            <div className="audit-chart">
              {bars.map((h, i) => (
                <motion.span
                  key={i}
                  className="audit-bar"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                />
              ))}
            </div>
          </div>

          <div className="audit-panel">
            <span className="audit-panel-title">By rep</span>
            <div className="audit-reps">
              {reps.map((rep) => (
                <div key={rep.name} className="audit-rep">
                  <span className="audit-rep-name">{rep.name}</span>
                  <span className="audit-rep-track">
                    <motion.span
                      className={`audit-rep-fill ${rep.tone}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${rep.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7 }}
                    />
                  </span>
                  <span className="audit-rep-score">{rep.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ObjectionsMock = () => {
  const rows = [
    { name: 'Timing', share: 31 },
    { name: 'Spouse / partner', share: 22 },
    { name: 'Needs to think', share: 17 },
    { name: 'Price', share: 14 },
  ]
  return (
    <div className="audit-mock">
      <div className="audit-mock-header">
        <span className="dashboard-title">Why prospects said no</span>
      </div>
      <div className="audit-mock-body">
        <div className="audit-reps">
          {rows.map((row) => (
            <div key={row.name} className="audit-rep wide">
              <span className="audit-rep-name">{row.name}</span>
              <span className="audit-rep-track">
                <motion.span
                  className="audit-rep-fill"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.share * 2}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                />
              </span>
              <span className="audit-rep-score">{row.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const QuotesMock = () => {
  const quotes = [
    '"We\'ve tried two agencies and neither one showed us numbers."',
    '"I need to know it works before I put my team on it."',
    '"Honestly, the last guy just sent us a login and disappeared."',
  ]
  return (
    <div className="audit-mock">
      <div className="audit-mock-header">
        <span className="dashboard-title">In the buyer's words</span>
      </div>
      <div className="audit-mock-body">
        <div className="quote-list">
          {quotes.map((quote) => (
            <p key={quote} className="quote-line">{quote}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

const IntegrityAudit = () => {
  const { openModal } = useDemoModal()

  return (
    <section id="integrity-audit" className="audit-section">
      <div className="container">
        <motion.div
          className="audit-visual audit-visual-lg"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Shot src="/integrity-audit-1.png" alt="Monthly Sales Integrity Audit" className="audit-screenshot">
            <AuditMock />
          </Shot>
        </motion.div>

        <motion.div
          className="section-header audit-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2>The report your leadership team <span className="gradient-text">actually reads.</span></h2>
          <p>Every month your leadership team receives a Sales Integrity Audit showing:</p>
        </motion.div>

        <ul className="audit-highlights">
          {highlights.map((item, index) => (
            <motion.li
              key={item}
              className="audit-highlight"
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
          className="audit-support"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Supported entirely by evidence from real sales conversations.
        </motion.p>

        <div className="audit-pair">
          <motion.div
            className="audit-visual"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Shot src="/integrity-audit-2.png" alt="Lost deal analysis" className="audit-screenshot">
              <ObjectionsMock />
            </Shot>
          </motion.div>

          <motion.div
            className="audit-visual"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Shot src="/integrity-audit-3.png" alt="Buyer language from recorded calls" className="audit-screenshot">
              <QuotesMock />
            </Shot>
          </motion.div>
        </div>

        <motion.p
          className="audit-evidence"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Evidence. Not opinions.
        </motion.p>

        <motion.div
          className="audit-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.button
            className="btn btn-primary"
            onClick={openModal}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            View an Integrity Audit
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default IntegrityAudit
