// Home page — the public landing page.
// Assembles the layout shell and landing sections in order.
import Navbar        from '../components/layout/Navbar'
import Footer        from '../components/layout/Footer'
import Hero          from '../components/landing/Hero'
import WhyItMatters  from '../components/landing/WhyItMatters'
import HowItWorks    from '../components/landing/HowItWorks'
import Features      from '../components/landing/Features'
import StatsCounter  from '../components/landing/StatsCounter'
import CareerStreams  from '../components/landing/CareerStreams'
import Testimonials  from '../components/landing/Testimonials'

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
        <CareerStreams />
        <Testimonials />
        {/* More sections coming: FAQ, CTA */}
      </main>
      <Footer />
    </>
  )
}

export default Home
