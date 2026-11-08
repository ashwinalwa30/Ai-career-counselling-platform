// Home page — the complete public landing page.
// Sections are ordered to tell a story: hook → problem → solution → proof → action.
import Navbar        from '../components/layout/Navbar'
import Footer        from '../components/layout/Footer'
import Hero          from '../components/landing/Hero'
import WhyItMatters  from '../components/landing/WhyItMatters'
import HowItWorks    from '../components/landing/HowItWorks'
import Features      from '../components/landing/Features'
import StatsCounter  from '../components/landing/StatsCounter'
import CareerStreams  from '../components/landing/CareerStreams'
import Testimonials  from '../components/landing/Testimonials'
import FAQ           from '../components/landing/FAQ'
import CallToAction  from '../components/landing/CallToAction'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />          {/* Hook: big promise, animated illustration   */}
        <WhyItMatters />  {/* Problem: 3 stat cards framing the gap      */}
        <HowItWorks />    {/* Solution: 4-step process                   */}
        <Features />      {/* Capabilities: 6 feature cards              */}
        <StatsCounter />  {/* Social proof: 4 animated counters          */}
        <CareerStreams />  {/* Breadth: 6 stream cards                   */}
        <Testimonials />  {/* Trust: carousel of student/parent/teacher  */}
        <FAQ />           {/* Objections: accordion, 6 questions         */}
        <CallToAction />  {/* Close: teal band, marigold CTA button      */}
      </main>
      <Footer />
    </>
  )
}

export default Home
