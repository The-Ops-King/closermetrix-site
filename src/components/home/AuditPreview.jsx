import { useState } from 'react'
import { motion } from 'framer-motion'

/*
 * Compact Integrity Audit preview for the hero. Drop a real screenshot at
 * public/integrity-audit-hero.png and it replaces the mock automatically.
 */
const bars = [64, 79, 58, 88, 71, 83, 91]

const AuditPreview = () => {
  const [hasShot, setHasShot] = useState(true)

  if (hasShot) {
    return (
      <img
        src="/integrity-audit-hero.png"
        alt="Sales Integrity Audit preview"
        className="audit-preview-shot"
        onError={() => setHasShot(false)}
      />
    )
  }

  return (
    <motion.div className="audit-preview" whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
      <div className="audit-preview-header">
        <div className="dashboard-dots">
          <span style={{ background: '#ff5f57' }}></span>
          <span style={{ background: '#febc2e' }}></span>
          <span style={{ background: '#28c840' }}></span>
        </div>
        <span className="dashboard-title">Sales Integrity Audit — March</span>
      </div>

      <div className="audit-preview-body">
        <div className="audit-preview-stats">
          <div className="audit-stat">
            <span className="audit-stat-label">Process followed</span>
            <span className="audit-stat-value">78%</span>
            <span className="audit-stat-change positive">+6 pts</span>
          </div>
          <div className="audit-stat">
            <span className="audit-stat-label">CRM accuracy</span>
            <span className="audit-stat-value">94%</span>
            <span className="audit-stat-change positive">+21 pts</span>
          </div>
        </div>

        <div className="audit-panel">
          <span className="audit-panel-title">What changed this month</span>
          <div className="audit-chart">
            {bars.map((h, i) => (
              <motion.span
                key={i}
                className="audit-bar"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.7, delay: 0.5 + i * 0.07 }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="audit-preview-finding"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          Implementation concerns appeared three times more often than pricing.
        </motion.div>
      </div>

      <div className="dashboard-glow" />
    </motion.div>
  )
}

export default AuditPreview
