import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import GooeyNav from './GooeyNav'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '/pricing', isRoute: true },
  ]

  const handleNavClick = (item) => {
    setIsMobileMenuOpen(false)
    if (item.isRoute) {
      navigate(item.href)
    } else if (location.pathname !== '/') {
      navigate('/' + item.href)
    } else {
      const target = document.querySelector(item.href)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <motion.nav
      className={`navbar ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="nav-container">
        <motion.a
          href="/"
          className="logo"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img src="/logo.png" alt="CloserMetrix" className="logo-img" />
        </motion.a>

        {/* Gooey Nav for desktop */}
        <div className="nav-gooey-wrapper">
          <GooeyNav items={navItems} />
        </div>

        <motion.a
          href="#cta"
          className="nav-cta"
          onClick={(e) => {
            e.preventDefault()
            if (location.pathname !== '/') {
              navigate('/#cta')
            } else {
              const target = document.querySelector('#cta')
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' })
              }
            }
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 255, 136, 0.5)' }}
          whileTap={{ scale: 0.95 }}
        >
          Join Waitlist
        </motion.a>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <motion.span
            animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 7 : 0 }}
          />
          <motion.span
            animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
          />
          <motion.span
            animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -7 : 0 }}
          />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(item)
                }}
                whileHover={{ x: 10, color: '#00ff88' }}
              >
                {item.label}
              </motion.a>
            ))}
            <a
              href="#cta"
              className="mobile-cta"
              onClick={(e) => {
                e.preventDefault()
                setIsMobileMenuOpen(false)
                if (location.pathname !== '/') {
                  navigate('/#cta')
                } else {
                  const target = document.querySelector('#cta')
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' })
                  }
                }
              }}
            >
              Join Waitlist
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
