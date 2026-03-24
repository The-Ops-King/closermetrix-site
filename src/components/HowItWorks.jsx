import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'

const YOUTUBE_VIDEO_ID = 'XxIL5ulcIYY'

const VideoPlayer = () => {
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [apiReady, setApiReady] = useState(false)

  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => setApiReady(true)
    return () => { window.onYouTubeIframeAPIReady = null }
  }, [])

  useEffect(() => {
    if (!apiReady) return
    playerRef.current = new window.YT.Player('yt-player', {
      videoId: YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 1,
        loop: 1,
        playlist: YOUTUBE_VIDEO_ID,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => {},
      },
    })
    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [apiReady])

  const handleUnmute = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    p.seekTo(0)
    p.unMute()
    p.setVolume(100)
    p.playVideo()
    setIsMuted(false)
    setShowUnmuteBtn(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      ref={containerRef}
      style={{
        position: 'relative',
        maxWidth: '800px',
        margin: '0 auto 3rem',
        borderRadius: isFullscreen ? 0 : '16px',
        overflow: 'hidden',
        boxShadow: isFullscreen ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.3)',
        background: '#000',
      }}
    >
      <div style={{ position: 'relative', paddingBottom: isFullscreen ? 0 : '56.25%', height: isFullscreen ? '100vh' : 0 }}>
        <div
          id="yt-player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Unmute overlay - covers entire video */}
      <AnimatePresence>
        {isMuted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleUnmute}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              cursor: 'pointer',
              background: 'rgba(0, 0, 0, 0.25)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'rgba(99, 102, 241, 0.95)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                borderRadius: '50px',
                padding: '16px 32px',
                fontSize: '1.05rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.5)',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              Click here to unmute
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
        title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </motion.button>
    </motion.div>
  )
}

const steps = [
  {
    number: '01',
    title: 'Connect Your Tools',
    description: 'Link your calendar and call recording platform. Takes less than 5 minutes to set up.',
  },
  {
    number: '02',
    title: 'AI Analyzes Every Call',
    description: 'Our system automatically processes recordings, transcribes, and extracts key metrics.',
  },
  {
    number: '03',
    title: 'Get Actionable Insights',
    description: 'Within 24 hours, access dashboards showing exactly where to focus your coaching.',
  },
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
          <h2>From Calls to Insights in <span className="gradient-text">3 Steps</span></h2>
          <p>No complex setup. No team training. Just connect and go.</p>
        </motion.div>

        <VideoPlayer />

        <div className="steps-container">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="step"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div
                className="step-number"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {step.number}
              </motion.div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  className="step-connector"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="testimonial-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="quote-icon">"</div>
          <p className="testimonial-text">
            We went from guessing why deals were dying to knowing exactly which objections to train on.
            The time savings alone paid for CloserMetrix in the first week.
          </p>
          <div className="testimonial-author">
            <motion.div
              className="author-avatar"
              whileHover={{ scale: 1.1 }}
            >
              JM
            </motion.div>
            <div className="author-info">
              <span className="author-name">Sales Director</span>
              <span className="author-title">High-Ticket Coaching Company</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export { VideoPlayer }
export default HowItWorks
