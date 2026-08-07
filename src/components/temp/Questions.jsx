import { motion } from 'framer-motion'

const questions = [
  'Why did close rate change?',
  'Why are prospects saying no?',
  'Which objections are increasing?',
  'Which reps follow the process?',
  'What language closes deals?',
  'Which promises are reps making?',
  'Which avatars convert best?',
  'What changed this month?',
  'Which calls deserve review?',
  'Can I trust my CRM?',
  'What pain points appear most often?',
  'Which closer skips discovery?',
  'What promises correlate with won deals?',
  'What changed after our new offer launched?',
  'Why are deals stalling?',
  'What trends should leadership know?',
  'Which goals do buyers bring up unprompted?',
  'Where in the call do deals go sideways?',
  'What are buyers comparing us to?',
  'Which follow-ups actually got made?',
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

        <ul className="questions-grid">
          {questions.map((question, index) => (
            <motion.li
              key={question}
              className="question-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
            >
              <span className="question-mark">?</span>
              <span className="question-text">{question}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Questions
