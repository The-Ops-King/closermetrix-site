import { motion } from 'framer-motion'

const questions = [
  'Why did close rate change?',
  'Why are prospects saying no?',
  'Which objections are increasing?',
  'Which reps follow the process?',
  'What language actually resonates?',
  'Can I trust my CRM?',
  'Which calls deserve review?',
  'What changed this month?',
]

const Questions = () => {
  return (
    <section id="questions" className="questions-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Questions CloserMetrix <span className="gradient-text">Answers</span></h2>
        </motion.div>

        <div className="questions-grid">
          {questions.map((question, index) => (
            <motion.div
              key={question}
              className="question-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (index % 4) * 0.08 }}
            >
              <span className="question-mark">?</span>
              <span className="question-text">{question}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Questions
