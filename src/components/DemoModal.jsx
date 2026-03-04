import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import emailjs from '@emailjs/browser'
import { useDemoModal } from '../hooks/useDemoModal'

const DEMO_URL = 'https://calendar.app.google/42Lw245o4mHrd35j9'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL

const DemoModal = () => {
  const { isOpen, closeModal } = useDemoModal()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim() && !form.phone.trim()) {
      newErrors.contact = 'Email or phone number is required'
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')

    // Log to n8n webhook (survives page navigation)
    if (WEBHOOK_URL) {
      const payload = JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        timestamp: new Date().toISOString(),
      })
      navigator.sendBeacon(WEBHOOK_URL, new Blob([payload], { type: 'application/json' }))
    }

    // Send email via EmailJS — await it so it finishes before redirect
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: 'closermetrix@jtylerray.com',
          from_name: form.name,
          name: form.name,
          email: form.email || 'Not provided',
          phone: form.phone || 'Not provided',
          message: `New demo request:\nName: ${form.name}\nEmail: ${form.email || 'Not provided'}\nPhone: ${form.phone || 'Not provided'}`,
        }, EMAILJS_PUBLIC_KEY)
      } catch (err) {
        console.warn('EmailJS error:', err)
        // Don't block redirect on email failure
      }
    }

    // Redirect to calendar
    setStatus('success')
    closeModal()
    setForm({ name: '', email: '', phone: '' })
    setErrors({})
    setStatus('idle')
    window.location.href = DEMO_URL
  }

  const handleClose = () => {
    closeModal()
    setForm({ name: '', email: '', phone: '' })
    setErrors({})
    setStatus('idle')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="demo-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="demo-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="demo-modal-close" onClick={handleClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <h3 className="demo-modal-title">Book a Demo</h3>
            <p className="demo-modal-subtitle">Tell us a bit about yourself and we'll get you scheduled.</p>

            <form className="demo-modal-form" onSubmit={handleSubmit}>
              <div className="demo-modal-field">
                <label htmlFor="demo-name">Name *</label>
                <input
                  id="demo-name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={status === 'loading'}
                />
                {errors.name && <span className="demo-modal-error">{errors.name}</span>}
              </div>

              <div className="demo-modal-field">
                <label htmlFor="demo-email">Email</label>
                <input
                  id="demo-email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={status === 'loading'}
                />
                {errors.email && <span className="demo-modal-error">{errors.email}</span>}
              </div>

              <div className="demo-modal-field">
                <label htmlFor="demo-phone">Phone</label>
                <input
                  id="demo-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={status === 'loading'}
                />
              </div>

              {errors.contact && <span className="demo-modal-error">{errors.contact}</span>}

              <motion.button
                type="submit"
                className="btn btn-primary demo-modal-submit"
                disabled={status === 'loading' || status === 'success'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'idle' && 'Continue to Booking'}
                {status === 'loading' && 'Submitting...'}
                {status === 'success' && 'Redirecting to calendar...'}
                {status === 'error' && 'Something went wrong — try again'}
              </motion.button>

              <p className="demo-modal-note">* Email or phone number required</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DemoModal
