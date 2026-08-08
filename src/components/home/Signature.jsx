import { motion } from 'framer-motion'

const Signature = () => (
  <section className="signature-section">
    <div className="container">
      <motion.p
        className="signature-line"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        Every sales call should leave your business{' '}
        <span className="gradient-text">smarter than it was before.</span>
      </motion.p>
    </div>
  </section>
)

export default Signature
