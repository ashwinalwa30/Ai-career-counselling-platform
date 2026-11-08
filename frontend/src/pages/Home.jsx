// Home page — the public landing page.
// Assembles the layout shell and landing sections in order.
import Navbar        from '../components/layout/Navbar'
import Footer        from '../components/layout/Footer'
import Hero          from '../components/landing/Hero'
import WhyItMatters  from '../components/landing/WhyItMatters'
import HowItWorks    from '../components/landing/HowItWorks'
import Features      from '../components/landing/Features'
import StatsCounter  from '../components/landing/StatsCounter'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhyItMatters />
        <HowItWorks />
        <Features />
        <StatsCounter />
        {/* More sections coming: CareerStreams, Testimonials, FAQ, CTA */}
      </main>
      <Footer />
    </>
  )
}

export default Home
