import Hero from './components/temp/Hero'
import Problem from './components/temp/Problem'
import HowItWorks from './components/temp/HowItWorks'
import WhoItsFor from './components/temp/WhoItsFor'
import Automated from './components/temp/Automated'
import IntegrityAudit from './components/temp/IntegrityAudit'
import Questions from './components/temp/Questions'
import WhatWeDont from './components/temp/WhatWeDont'
import Pricing from './components/temp/Pricing'
import CTA from './components/temp/CTA'

/*
 * New positioning page. Lives at /temp while the original homepage stays at /.
 * This tree is what scripts/prerender.mjs renders to static HTML for crawlers.
 */
const TempPage = () => (
  <>
    <Hero />
    <Problem />
    <HowItWorks />
    <WhoItsFor />
    <Automated />
    <IntegrityAudit />
    <Questions />
    <WhatWeDont />
    <Pricing />
    <CTA />
  </>
)

export default TempPage
