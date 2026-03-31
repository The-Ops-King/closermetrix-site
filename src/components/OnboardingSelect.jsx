import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import '../styles/onboarding.css'

const platforms = [
  {
    id: 'tldv',
    name: 'tl;dv',
    description: 'AI meeting recorder for Zoom, Google Meet & Teams',
    icon: '🎥',
  },
  {
    id: 'fathom',
    name: 'Fathom',
    description: 'AI notetaker for video calls',
    icon: '🧠',
  },
  {
    id: 'gong',
    name: 'Gong',
    description: 'Revenue intelligence platform',
    icon: '🔔',
    comingSoon: true,
  },
  {
    id: 'fireflies',
    name: 'Fireflies.ai',
    description: 'AI meeting assistant',
    icon: '🔥',
    comingSoon: true,
  },
]

export default function OnboardingSelect() {
  const navigate = useNavigate()

  return (
    <section className="onboarding-section">
      <div className="container">
        <motion.div
          className="onboarding-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge">Welcome Aboard</span>
          <h1>
            Congrats — we're excited to have you{' '}
            <span className="gradient-text">onboarding with CloserMetrix!</span>
          </h1>
          <p className="onboarding-subtitle">
            Let's get your team set up. The entire process takes about 15–20
            minutes. First, tell us what call recording software your team uses.
          </p>
        </motion.div>

        <motion.div
          className="platform-grid"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="platform-question">
            What call recording software are you using?
          </h2>
          <div className="platform-cards">
            {platforms.map((platform, index) => (
              <motion.button
                key={platform.id}
                className={`platform-card ${platform.comingSoon ? 'coming-soon' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={!platform.comingSoon ? { scale: 1.03, borderColor: 'rgba(0, 255, 136, 0.4)' } : {}}
                whileTap={!platform.comingSoon ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (!platform.comingSoon) {
                    navigate(`/onboarding/${platform.id}`)
                  }
                }}
                disabled={platform.comingSoon}
              >
                <div className="platform-icon">{platform.icon}</div>
                <div className="platform-info">
                  <h3>{platform.name}</h3>
                  <p>{platform.description}</p>
                </div>
                {platform.comingSoon && (
                  <span className="coming-soon-badge">Coming Soon</span>
                )}
                {!platform.comingSoon && (
                  <span className="platform-arrow">→</span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="onboarding-help"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p>
            Using a different platform?{' '}
            <a href="mailto:closermetrix@jtylerray.com">Contact us</a> and
            we'll get you set up.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
