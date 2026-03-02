import { useState } from 'react'
import { motion } from 'framer-motion'

const RevenueCalculator = () => {
  const [closers, setClosers] = useState(5)
  const [callsPerDay, setCallsPerDay] = useState(6)
  const [offerPrice, setOfferPrice] = useState(5000)
  const [showRate, setShowRate] = useState(60)
  const [closeRate, setCloseRate] = useState(20)

  const weeksPerMonth = 4.33
  const daysPerWeek = 5

  // Current numbers
  const callsPerMonth = closers * callsPerDay * daysPerWeek * weeksPerMonth
  const showsPerMonth = callsPerMonth * (showRate / 100)
  const closesPerMonth = showsPerMonth * (closeRate / 100)
  const currentRevenue = closesPerMonth * offerPrice

  // With CloserMetrix: +3 calls/week/closer, +5% close rate
  const extraCallsPerMonth = closers * 3 * weeksPerMonth
  const newCallsPerMonth = callsPerMonth + extraCallsPerMonth
  const newCloseRate = Math.min(closeRate + 5, 100)
  const newShowsPerMonth = newCallsPerMonth * (showRate / 100)
  const newClosesPerMonth = newShowsPerMonth * (newCloseRate / 100)
  const newRevenue = newClosesPerMonth * offerPrice

  const difference = newRevenue - currentRevenue

  const formatMoney = (n) =>
    '$' + Math.round(n).toLocaleString()

  return (
    <section className="calculator-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge">Calculator</span>
          <h2>How Much Are You <span className="gradient-text">Leaving on the Table?</span></h2>
          <p>See what an extra 3 calls/week per closer and a 5% bump in close rate does to your bottom line.</p>
        </motion.div>

        <motion.div
          className="calculator-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="calculator-inputs">
            <div className="calc-field">
              <label>Closers</label>
              <input
                type="number"
                min="1"
                value={closers}
                onChange={(e) => setClosers(Math.max(1, +e.target.value))}
              />
            </div>
            <div className="calc-field">
              <label>Calls / Day / Closer</label>
              <input
                type="number"
                min="1"
                value={callsPerDay}
                onChange={(e) => setCallsPerDay(Math.max(1, +e.target.value))}
              />
            </div>
            <div className="calc-field">
              <label>Offer Price ($)</label>
              <input
                type="number"
                min="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Math.max(1, +e.target.value))}
              />
            </div>
            <div className="calc-field">
              <label>Show Rate (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={showRate}
                onChange={(e) => setShowRate(Math.min(100, Math.max(1, +e.target.value)))}
              />
            </div>
            <div className="calc-field">
              <label>Close Rate (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={closeRate}
                onChange={(e) => setCloseRate(Math.min(100, Math.max(1, +e.target.value)))}
              />
            </div>
          </div>

          <div className="calculator-results">
            <div className="calc-result-row">
              <div className="calc-result current">
                <span className="calc-result-label">Current Monthly Revenue</span>
                <span className="calc-result-value">{formatMoney(currentRevenue)}</span>
              </div>
              <div className="calc-result-arrow">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--aurora-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className="calc-result projected">
                <span className="calc-result-label">With CloserMetrix</span>
                <span className="calc-result-value glow">{formatMoney(newRevenue)}</span>
              </div>
            </div>
            <div className="calc-difference">
              <span className="calc-difference-label">You could be missing out on</span>
              <span className="calc-difference-value">{formatMoney(difference)}</span>
              <span className="calc-difference-period">/ month</span>
            </div>
            <p className="calc-explainer">
              By cutting admin time and automating call analysis, your closers get back <strong>3 more calls per week each</strong>. Better data means better coaching — we model a <strong>5% lift in close rate</strong>. That's what the numbers above reflect.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default RevenueCalculator
