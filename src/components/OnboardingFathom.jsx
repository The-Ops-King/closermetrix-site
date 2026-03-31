import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import '../styles/onboarding.css'

const SERVICE_EMAIL = 'closermetrix@closer-automation.iam.gserviceaccount.com'

const WEBHOOK_BODY = `{
  "client_id": "YOUR_CLIENT_ID",
  "prospect_email": "{{prospect email from trigger}}",
  "payment_amount": {{payment amount from trigger}},
  "prospect_name": "{{prospect name from trigger}}",
  "product_name": "{{product name from trigger}}",
  "payment_type": "full",
  "payment_date": "{{payment date from trigger}}"
}`

const steps = [
  {
    number: 1,
    title: 'Connect Fathom to CloserMetrix',
    why: 'Two things to set up — your API key (so we can pull meeting data) and auto-recording (so every call is captured). Fathom pushes transcripts to us automatically.',
    content: (
      <>
        <h4>1A: Get Your Fathom API Key</h4>
        <ol className="step-instructions">
          <li>Log in to <a href="https://fathom.video" target="_blank" rel="noopener noreferrer">Fathom</a></li>
          <li>Go to <strong>Settings</strong> (gear icon)</li>
          <li>Navigate to <strong>Integrations</strong> or <strong>API</strong></li>
          <li>Copy your <strong>API key</strong></li>
          <li>Send it to your CloserMetrix contact</li>
        </ol>
        <div className="step-note" style={{ marginBottom: '24px' }}>
          <strong>Why we need this:</strong> The API key lets CloserMetrix pull meeting details and transcripts from your Fathom account. We never access your recordings directly — Fathom pushes the data to us via a secure webhook.
        </div>

        <h4>1B: Make Sure Fathom Is Recording</h4>
        <ol className="step-instructions">
          <li>Install <a href="https://fathom.video" target="_blank" rel="noopener noreferrer">Fathom</a> if not already installed</li>
          <li>Connect it to your meeting platform (Zoom, Google Meet, etc.)</li>
          <li>Ensure <strong>auto-record</strong> is enabled for all meetings</li>
          <li>Do a test call to confirm Fathom is transcribing</li>
        </ol>
        <div className="step-note">
          <strong>No special CloserMetrix configuration needed in Fathom.</strong> Once your CloserMetrix contact registers the webhook with your API key, transcripts flow to CloserMetrix automatically.
        </div>
      </>
    ),
  },
  {
    number: 2,
    title: 'Share Calendars & Use Consistent Event Titles',
    why: 'Calendar sharing is how we track which calls were booked, held, ghosted, rescheduled, or canceled. Consistent titles let us identify which events are sales calls.',
    content: (
      <>
        <h4>2A: Each Closer Shares Their Google Calendar</h4>
        <p className="step-context">Every closer on your team needs to share their Google Calendar with CloserMetrix. It's just like sharing a calendar with a coworker — no OAuth, no admin panels.</p>
        <ol className="step-instructions">
          <li>Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">Google Calendar</a></li>
          <li>Find your calendar in the left sidebar (under "My calendars")</li>
          <li>Click the <strong>three dots</strong> next to your calendar name</li>
          <li>Click <strong>Settings and sharing</strong></li>
          <li>Scroll to <strong>Share with specific people or groups</strong></li>
          <li>Click <strong>+ Add people and groups</strong></li>
          <li>Enter this email address:</li>
        </ol>
        <CopyBlock text={SERVICE_EMAIL} />
        <ol className="step-instructions" start={8}>
          <li>Set permission to <strong>See all event details</strong></li>
          <li>Click <strong>Send</strong></li>
        </ol>
        <div className="step-note" style={{ marginBottom: '24px' }}>
          <strong>Privacy note:</strong> We only look at events that match your sales call trigger word (e.g., "Strategy Call"). Personal events and everything else are ignored.
        </div>

        <h4>2B: Use Consistent Calendar Event Titles</h4>
        <p className="step-context">Your calendar events need to contain your <strong>trigger word</strong> in the title so CloserMetrix can identify sales calls.</p>
        <div className="example-block good">
          <h4>Good event titles:</h4>
          <ul>
            <li>"Strategy Call - John Smith"</li>
            <li>"Strategy Call with Jane Doe"</li>
            <li>"Strategy Call | Lead from Facebook"</li>
          </ul>
        </div>
        <div className="example-block bad">
          <h4>Won't be detected:</h4>
          <ul>
            <li>"Call with John" (missing trigger word)</li>
            <li>"Meeting - John Smith" (wrong word)</li>
          </ul>
        </div>
        <div className="step-note">
          <strong>Tip:</strong> If your scheduling tool (GHL, Calendly, etc.) creates events automatically, check what title format it uses. Let your CloserMetrix contact know the exact wording and we'll configure it. We support multiple trigger words — for example: "Strategy Call" for first calls and "Follow Up Call" for follow-ups.
        </div>
      </>
    ),
  },
  {
    number: 3,
    title: 'Connect Your Payment Processor',
    why: 'When a payment comes in, CloserMetrix automatically matches it to the sales call and marks the deal as won. This connects your revenue data to closer performance.',
    content: (
      <>
        <p className="step-context">Set up a Zapier (or Make) automation that fires whenever a payment comes through your processor (Stripe, GHL, Keap, PayPal, etc.) and sends it to CloserMetrix.</p>

        <h4>Zapier Setup</h4>
        <ol className="step-instructions">
          <li><strong>Trigger:</strong> New payment/charge in your payment processor</li>
          <li><strong>Action:</strong> Webhooks by Zapier → <strong>POST</strong> request</li>
          <li><strong>URL:</strong></li>
        </ol>
        <CopyBlock text="https://api.closermetrix.com/webhooks/payment" />

        <h4>Required Headers</h4>
        <div className="webhook-table">
          <table>
            <thead>
              <tr><th>Header</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td><code>Content-Type</code></td><td><code>application/json</code></td></tr>
              <tr><td><code>Authorization</code></td><td><code>Bearer YOUR_WEBHOOK_SECRET</code></td></tr>
            </tbody>
          </table>
        </div>
        <div className="step-note" style={{ marginTop: '12px', marginBottom: '20px' }}>
          Your CloserMetrix contact will provide your webhook secret.
        </div>

        <h4>JSON Body</h4>
        <div className="code-block">
          <pre><code>{WEBHOOK_BODY}</code></pre>
        </div>

        <h4>Field Reference</h4>
        <div className="webhook-table">
          <table>
            <thead>
              <tr><th>Field</th><th>Required?</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>client_id</code></td><td>Yes</td><td>Your unique client ID (provided by your CloserMetrix contact)</td></tr>
              <tr><td><code>prospect_email</code></td><td>Yes</td><td>The buyer's email — this is how we match the payment to the call</td></tr>
              <tr><td><code>payment_amount</code></td><td>Yes</td><td>Dollar amount (number, no $ sign)</td></tr>
              <tr><td><code>prospect_name</code></td><td>No</td><td>Buyer's name</td></tr>
              <tr><td><code>product_name</code></td><td>No</td><td>What they purchased</td></tr>
              <tr><td><code>payment_type</code></td><td>No</td><td><code>full</code>, <code>deposit</code>, or <code>installments</code> (defaults to <code>full</code>)</td></tr>
              <tr><td><code>payment_date</code></td><td>No</td><td>When the payment occurred (defaults to now)</td></tr>
              <tr><td><code>notes</code></td><td>No</td><td>Any additional context</td></tr>
            </tbody>
          </table>
        </div>

        <div className="step-note" style={{ marginTop: '16px', marginBottom: '12px' }}>
          <strong>How it works:</strong> When a payment webhook comes in, CloserMetrix matches the <code style={{ color: 'var(--aurora-green)' }}>prospect_email</code> to the most recent call with that prospect and updates the outcome to "Closed - Won" (or "Deposit" if <code style={{ color: 'var(--aurora-green)' }}>payment_type</code> is <code style={{ color: 'var(--aurora-green)' }}>deposit</code>). Revenue and cash collected are recorded automatically.
        </div>
        <div className="step-note warning">
          <strong>Important:</strong> The <code style={{ color: 'var(--aurora-green)' }}>prospect_email</code> in the payment MUST match the email used during the sales call. If your CRM stores a different email than what's on the calendar invite, the match will fail.
        </div>
      </>
    ),
  },
]

const ownerChecklist = [
  'Sent Fathom API key to your CloserMetrix contact',
  'Confirmed Fathom auto-record is enabled',
  'Sent list of closers (name + email) to your CloserMetrix contact',
  'Confirmed calendar trigger word(s) with your CloserMetrix contact',
  'Set up payment webhook in Zapier/Make (with webhook secret + client ID)',
  'Received and bookmarked dashboard link',
]

const closerChecklist = [
  `Shared Google Calendar with ${SERVICE_EMAIL}`,
  'Confirmed Fathom is installed and auto-recording',
  'Confirmed calendar events use the correct trigger word',
  'Accessed the dashboard link to verify it works',
]

const faqs = [
  { q: 'Does CloserMetrix listen to my calls live?', a: 'No. We only receive the transcript after the call ends. We never join, record, or listen to calls in real-time.' },
  { q: 'What if a closer uses a different email for their calendar?', a: 'The email used to add the closer in CloserMetrix must match their Google Calendar email. Let your CloserMetrix contact know if a closer uses different emails for different tools.' },
  { q: 'How quickly do results appear after a call?', a: 'Usually within 2–5 minutes after Fathom finishes transcribing.' },
  { q: 'What if a call doesn\'t show up on the dashboard?', a: 'Check three things: (1) Did Fathom record it? (2) Does the calendar event title contain the trigger word? (3) Is the closer\'s calendar shared with CloserMetrix?' },
  { q: 'Can I change the AI scoring criteria?', a: 'Yes — custom scoring instructions can be configured per section (discovery, pitch, close, objections). Talk to your CloserMetrix contact about fine-tuning.' },
  { q: 'What about calls that aren\'t sales calls?', a: 'CloserMetrix only processes calls that match your trigger word. Everything else is ignored.' },
  { q: 'Is my data shared with other clients?', a: 'Absolutely not. Every client\'s data is completely isolated. No client can see another client\'s data.' },
]

function CopyBlock({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="copy-block">
      <code>{text}</code>
      <button onClick={handleCopy} className="copy-btn">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function StepCard({ step, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className="onboarding-step"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <button
        className={`step-header ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="step-number">{step.number}</div>
        <h3>{step.title}</h3>
        <span className="step-toggle">{isOpen ? '−' : '+'}</span>
      </button>
      <motion.div
        className="step-body"
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="step-body-inner">
          <div className="step-why">
            <em>{step.why}</em>
          </div>
          {step.content}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ChecklistSection({ title, items }) {
  const [checked, setChecked] = useState(() => items.map(() => false))

  const toggle = (i) => {
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const done = checked.filter(Boolean).length

  return (
    <div className="checklist-group">
      <div className="checklist-header">
        <h3>{title}</h3>
        <span className="checklist-progress">
          {done}/{items.length} complete
        </span>
      </div>
      {items.map((item, i) => (
        <label key={i} className={`checklist-item ${checked[i] ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => toggle(i)}
          />
          <span className="checkmark" />
          <span className="checklist-text">{item}</span>
        </label>
      ))}
    </div>
  )
}

function FaqItem({ q, a, index }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      className="onboarding-faq-item"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        className={`faq-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{q}</span>
        <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
      </button>
      <motion.div
        className="faq-answer"
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <p>{a}</p>
      </motion.div>
    </motion.div>
  )
}

export default function OnboardingFathom() {
  return (
    <section className="onboarding-section onboarding-guide">
      <div className="container">
        {/* Header */}
        <motion.div
          className="onboarding-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link to="/onboarding" className="back-link">
            ← Back to platform select
          </Link>
          <span className="badge">Onboarding Guide — Fathom</span>
          <h1>
            Let's get your team{' '}
            <span className="gradient-text">up and running</span>
          </h1>
          <p className="onboarding-subtitle">
            This guide walks you through everything needed to set up CloserMetrix
            with Fathom. The entire process takes about 15–20 minutes.
          </p>
        </motion.div>

        {/* Loom Video */}
        <motion.div
          className="loom-embed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Watch the Setup Walkthrough</h2>
          <div className="loom-placeholder">
            <div className="loom-placeholder-inner">
              <span className="loom-play">▶</span>
              <p>Loom video will be embedded here</p>
              <p className="loom-hint">Replace this with your Loom embed URL in OnboardingFathom.jsx</p>
            </div>
          </div>
        </motion.div>

        {/* What You'll Need */}
        <motion.div
          className="prep-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2>What You'll Need</h2>
          <div className="prep-grid">
            {[
              { icon: '🔑', text: 'Your Fathom API key' },
              { icon: '👥', text: 'List of closers — name and work email for each' },
              { icon: '🎯', text: 'Trigger word for sales calls (e.g., "Strategy Call")' },
              { icon: '💳', text: 'Access to your payment processor or CRM automation tool' },
            ].map((item, i) => (
              <div key={i} className="prep-item">
                <span className="prep-icon">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step-by-Step */}
        <div className="steps-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Step-by-Step Setup
          </motion.h2>
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* How It Works Flow */}
        <motion.div
          className="flow-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>What Happens After Setup</h2>
          <div className="flow-steps">
            {[
              { icon: '📞', text: 'Closer has a sales call' },
              { icon: '🎥', text: 'Fathom records and transcribes the call' },
              { icon: '📡', text: 'Transcript is sent to CloserMetrix automatically' },
              { icon: '🤖', text: 'AI scores the call, detects objections, writes coaching notes' },
              { icon: '📊', text: 'Results appear on your dashboard within minutes' },
            ].map((item, i) => (
              <div key={i} className="flow-step">
                <div className="flow-icon">{item.icon}</div>
                <p>{item.text}</p>
                {i < 4 && <div className="flow-arrow">↓</div>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Checklists */}
        <motion.div
          className="checklist-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Onboarding Checklist</h2>
          <p className="checklist-intro">Track your progress — check off each item as you complete it.</p>
          <ChecklistSection title="Owner Tasks" items={ownerChecklist} />
          <ChecklistSection title="Each Closer" items={closerChecklist} />
        </motion.div>

        {/* Download PDF */}
        <motion.div
          className="download-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="download-card">
            <div className="download-info">
              <h3>Want a printable version?</h3>
              <p>Download the full onboarding guide as a PDF to share with your team.</p>
            </div>
            <a href="/onboarding-fathom-guide.pdf" download className="btn btn-primary download-btn">
              Download PDF
            </a>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="onboarding-faq"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Help */}
        <motion.div
          className="onboarding-help"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3>Need Help?</h3>
          <p>
            Contact your CloserMetrix rep for any setup issues or questions.
          </p>
          <div className="help-fixes">
            <p><strong>Calls not showing up</strong> → Check calendar sharing + trigger word</p>
            <p><strong>Transcripts not processing</strong> → Verify Fathom API key is correct</p>
            <p><strong>Wrong closer assigned</strong> → Check that work emails match calendar emails</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
