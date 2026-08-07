import { motion } from 'framer-motion'

/*
 * Hero visual — a compact Sales Integrity Audit. The audit is the strongest
 * asset on the page, so it leads rather than appearing halfway down.
 */
const bars = [72, 88, 61, 94, 55, 79, 68]

const reps = [
  { name: 'Sarah', score: 96, tone: 'good' },
  { name: 'Bob', score: 71, tone: 'warn' },
  { name: 'Marcus', score: 54, tone: 'bad' },
]

const AuditPreview = () => (
  <motion.div className="audit-mock audit-preview" whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
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
          <span className="audit-stat-change positive">+6 pts</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-label">CRM accuracy</span>
          <span className="audit-stat-value">94%</span>
          <span className="audit-stat-change positive">+21 pts</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-label">Top reason for no</span>
          <span className="audit-stat-value sm">Price</span>
          <span className="audit-stat-change">14% of losses</span>
        </div>
      </div>

      <div className="audit-mock-panels single">
        <div className="audit-panel">
          <span className="audit-panel-title">Process followed, by month</span>
          <div className="audit-chart">
            {bars.map((h, i) => (
              <motion.span
                key={i}
                className="audit-bar"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.07 }}
              />
            ))}
          </div>
        </div>

        <div className="audit-panel">
          <span className="audit-panel-title">By rep</span>
          <div className="audit-reps">
            {reps.map((rep, i) => (
              <div key={rep.name} className="audit-rep">
                <span className="audit-rep-name">{rep.name}</span>
                <span className="audit-rep-track">
                  <motion.span
                    className={`audit-rep-fill ${rep.tone}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${rep.score}%` }}
                    transition={{ duration: 0.7, delay: 0.7 + i * 0.1 }}
                  />
                </span>
                <span className="audit-rep-score">{rep.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="dashboard-glow" />
  </motion.div>
)

export default AuditPreview
