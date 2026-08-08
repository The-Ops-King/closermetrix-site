import './styles/home.css'
import Hero from './components/home/Hero'
import BlindSpot from './components/home/BlindSpot'
import Problem from './components/home/Problem'
import WhyItMatters from './components/home/WhyItMatters'
import HowItWorks from './components/home/HowItWorks'
import Deliverables from './components/home/Deliverables'
import IntegrityAudit from './components/home/IntegrityAudit'
import DecisionsEnabled from './components/home/DecisionsEnabled'
import Questions from './components/home/Questions'
import WhyCompaniesStay from './components/home/WhyCompaniesStay'
import Integrations from './components/home/Integrations'
import Philosophy from './components/home/Philosophy'
import Signature from './components/home/Signature'
import CTA from './components/home/CTA'

/*
 * The blind spot -> why it matters -> the solution -> what they get -> proof
 * -> questions answered -> decisions enabled -> CTA.
 * The site homepage. The previous one is kept at /v1 for rollback.
 */
const HomePage = () => (
  <div className="home-page">
    <Hero />
    <BlindSpot />
    <Problem />
    <WhyItMatters />
    <HowItWorks />
    <Deliverables />
    <IntegrityAudit />
    <DecisionsEnabled />
    <Questions />
    <WhyCompaniesStay />
    <Integrations />
    <Philosophy />
    <Signature />
    <CTA />
  </div>
)

export default HomePage
