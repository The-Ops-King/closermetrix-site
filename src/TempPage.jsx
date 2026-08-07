import './styles/temp.css'
import Hero from './components/temp/Hero'
import BlindSpot from './components/temp/BlindSpot'
import Problem from './components/temp/Problem'
import WhyItMatters from './components/temp/WhyItMatters'
import HowItWorks from './components/temp/HowItWorks'
import Deliverables from './components/temp/Deliverables'
import IntegrityAudit from './components/temp/IntegrityAudit'
import DecisionsEnabled from './components/temp/DecisionsEnabled'
import Questions from './components/temp/Questions'
import WhyCompaniesStay from './components/temp/WhyCompaniesStay'
import Integrations from './components/temp/Integrations'
import Philosophy from './components/temp/Philosophy'
import Signature from './components/temp/Signature'
import CTA from './components/temp/CTA'

/*
 * The blind spot -> why it matters -> the solution -> what they get -> proof
 * -> questions answered -> decisions enabled -> CTA.
 * Lives at /temp; the original homepage is untouched.
 */
const TempPage = () => (
  <div className="temp-page">
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

export default TempPage
