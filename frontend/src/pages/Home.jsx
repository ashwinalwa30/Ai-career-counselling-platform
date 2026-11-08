// Home page — the public landing page.
// Assembles the layout shell (Navbar, Footer) around the landing sections.
// More sections (How it works, Careers, FAQ) will be added in later steps.
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero   from '../components/landing/Hero'

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        {/* More sections go here: HowItWorks, CareerHighlights, FAQ … */}
      </main>

      <Footer />
    </>
  )
}

export default Home
