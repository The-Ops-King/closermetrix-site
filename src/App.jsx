import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Aurora from './components/Aurora'
import ShapeBlur from './components/ShapeBlur'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LogoLoop from './components/LogoLoop'
import Features from './components/Features'
import HowItWorks, { VideoPlayer } from './components/HowItWorks'
import Pricing from './components/Pricing'
import ZeroAdmin from './components/ZeroAdmin'
import RevenueCalculator from './components/RevenueCalculator'
import CTA from './components/CTA'
import Footer from './components/Footer'
import FAQ from './components/FAQ'
import DemoModal from './components/DemoModal'
import { DemoModalProvider } from './hooks/useDemoModal'

function HomePage({ logoItems }) {
  return (
    <>
      <Hero />

      {/* Logo Loop / Trust Bar */}
      <section className="logo-loop-section">
        <div className="container">
          <motion.p
            className="logo-loop-label"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Powering insights for high-ticket sales teams
          </motion.p>
        </div>
        <LogoLoop items={logoItems} speed={35} />
      </section>

      <Features />

      <section className="every-call-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge">Why CloserMetrix</span>
            <h2>Every Call, Fully <span className="gradient-text">Analyzed</span></h2>
            <p>Your closers are already on the phone. We make sure no insight gets left behind.</p>
          </motion.div>

          <div className="every-call-cards">
            <motion.div
              className="every-call-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="every-call-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3>Call Component Scoring</h3>
              <p>Every call is broken down into component parts — opening, discovery, pitch, objection handling, close — each judged and scored individually.</p>
            </motion.div>

            <motion.div
              className="every-call-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="every-call-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3>Objection Tracking by Closer</h3>
              <p>Track every individual objection down to the specific closer. See who handles what objections best, and who needs coaching on which areas.</p>
            </motion.div>

            <motion.div
              className="every-call-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="every-call-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3>Compliance Monitoring</h3>
              <p>Quietly monitors risk language before it becomes a problem.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <ZeroAdmin />
      <RevenueCalculator />
      <HowItWorks />
      <CTA />
    </>
  )
}

function HowItWorksPage() {
  return (
    <>
      <section className="video-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge">See It In Action</span>
            <h2>Every Call, Fully <span className="gradient-text">Analyzed</span></h2>
            <p>Your closers are already on the phone. We make sure no insight gets left behind.</p>
          </motion.div>
          <VideoPlayer />
        </div>
      </section>
      {/* <Pricing /> */}

      <section className="how-we-do-it">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge">How We Do It</span>
            <h2>Set Up in 20 Minutes. <span className="gradient-text">Insights by Tomorrow.</span></h2>
            <p style={{ maxWidth: '720px', margin: '0 auto' }}>
              Connect your closers' calendar, finances, and call recordings — that's it. Our AI handles
              the rest, breaking down every section of your sales process with extreme accuracy using
              prompts engineered by professionals. No training. No onboarding. No disruption.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            marginTop: '3rem',
            maxWidth: '900px',
            margin: '3rem auto 0',
          }}>
            {[
              {
                icon: '📅',
                title: 'Calendar Integration',
                desc: 'We connect to your closers\' calendars to track show rates, no-shows, and scheduling patterns automatically.',
              },
              {
                icon: '🧠',
                title: 'AI-Powered Call Analysis',
                desc: 'Every recorded call is automatically transcribed, broken into phases, and scored by professionally engineered AI — extracting objections, flagging compliance risks, and surfacing coaching insights.',
              },
              {
                icon: '💰',
                title: 'Financial Data',
                desc: 'Revenue, cash collected, and deal values flow in so you see the real dollars behind every metric.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
                whileHover={{
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  background: 'rgba(99, 102, 241, 0.05)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="problems-solved">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge">Results</span>
            <h2>10 Ways CloserMetrix <span className="gradient-text">Levels Up</span> Your Team</h2>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: '1.5rem',
            marginTop: '3rem',
          }}>
            {[
              {
                num: '01',
                title: 'Closers spend more time selling',
                desc: 'By eliminating forms, CRM updates, and manual logging, your closers get back 45+ minutes per day to take more calls and close more deals.',
              },
              {
                num: '02',
                title: 'Increase close rate with data-driven coaching',
                desc: 'Every call is scored by phase — opening, discovery, pitch, objection handling, close — so you coach on the exact skills that move the needle.',
              },
              {
                num: '03',
                title: 'See exactly where deals are won and lost',
                desc: 'AI pinpoints the exact moments prospects engage or disengage, broken down by objection type, closer, and call phase.',
              },
              {
                num: '04',
                title: 'Automatically capture every call detail',
                desc: 'Every call is transcribed, scored, and logged without your closers lifting a finger. No more chasing reps for notes.',
              },
              {
                num: '05',
                title: 'Identify and replicate your top performers',
                desc: 'Side-by-side benchmarking shows exactly what your best closers do differently — so you can train the rest of the team to match.',
              },
              {
                num: '06',
                title: 'Review only the calls that matter',
                desc: 'AI flags the specific calls worth your attention and tells you exactly why — spend minutes instead of hours on review.',
              },
              {
                num: '07',
                title: 'Maximize show rates and recover lost revenue',
                desc: 'Calendar + finance integration gives you real-time show rates, no-show patterns, and the exact dollars being left on the table.',
              },
              {
                num: '08',
                title: 'Stay ahead of compliance risk',
                desc: 'Automatic FTC/SEC language flagging with timestamps and full context — catch issues before they become problems.',
              },
              {
                num: '09',
                title: 'Catch emerging objections before they tank your numbers',
                desc: 'Objection tracking detects new patterns the moment they appear, so you can update scripts and training proactively.',
              },
              {
                num: '10',
                title: 'Forecast revenue with confidence',
                desc: 'AI-powered projections based on real pipeline data, pacing, and historical trends — so you always know where you stand.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
                whileHover={{
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  background: 'rgba(99, 102, 241, 0.05)',
                }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--aurora-purple, #8b5cf6)',
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: '2px',
                }}>{item.num}</span>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#fff',
                    marginBottom: '0.5rem',
                  }}>{item.title}</h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function FAQPage() {
  return <FAQ />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const logoItems = [
    { icon: '📊', text: 'AI-Powered Analytics' },
    { icon: '🎯', text: 'Close Rate Tracking' },
    { icon: '📞', text: 'Call Intelligence' },
    { icon: '⚡', text: 'Real-time Insights' },
    { icon: '🛡️', text: 'Compliance Monitoring' },
    { icon: '📈', text: 'Performance Metrics' },
    { icon: '🤖', text: 'Automated Reports' },
    { icon: '💡', text: 'Coaching Tips' },
  ]

  return (
    <DemoModalProvider>
      <div className="app">
        <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={1} amplitude={0}/>
        <ShapeBlur
          color1="#00ff88"
          color2="#00d4ff"
          color3="#6366f1"
          blur={100}
          opacity={0.2}
        />

        <AnimatePresence>
          {isLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ScrollToTop />
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage logoItems={logoItems} />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                </Routes>
              </main>
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>

        <DemoModal />
      </div>
    </DemoModalProvider>
  )
}

export default App
