import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const homeProductLinks = [
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'What You Get', href: '#deliverables' },
  { name: 'Integrity Audit', href: '#integrity-audit' },
]

const footerLinks = {
  Product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/pricing', isRoute: true },
    { name: 'How It Works', href: '#how-it-works' },
  ],
  Company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
}

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // The sales-intelligence page is the homepage; /v1 keeps the previous one.
  const isLegacy = location.pathname.startsWith('/v1')
  const links = isLegacy ? footerLinks : { ...footerLinks, Product: homeProductLinks }

  const handleLinkClick = (e, link) => {
    e.preventDefault()
    if (link.isRoute) {
      navigate(link.href)
      return
    }
    if (link.href === '#') return

    const target = document.querySelector(link.href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/' + link.href)
    }
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <motion.div
            className="footer-brand"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <a
              href="/"
              className="logo"
              onClick={(e) => {
                e.preventDefault()
                navigate('/')
              }}
            >
              <img src="/logo-full.png" alt="CloserMetrix - Sales Intelligence for High-Ticket Sales Teams" className="logo-img-full" />
            </a>
            <p>
              {isLegacy
                ? 'AI-powered sales coaching, call scoring, and conversation intelligence for high-ticket sales teams.'
                : 'The Sales Intelligence Layer for high-ticket sales teams.'}
            </p>
          </motion.div>

          <div className="footer-links">
            {Object.entries(links).map(([category, categoryLinks], categoryIndex) => (
              <motion.div
                key={category}
                className="footer-column"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h4>{category}</h4>
                {categoryLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    whileHover={{ x: 5, color: '#00ff88' }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="footer-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p>&copy; {new Date().getFullYear()} CloserMetrix. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
