import Header from './components/layout/Header'
import QuickMenu from './components/layout/QuickMenu'
import Footer from './components/layout/Footer'
import HeroSection from './components/home/HeroSection'
import TreatmentSection from './components/home/TreatmentSection'
import BestSellerSection from './components/home/BestSellerSection'
import SpecialSection from './components/home/SpecialSection'
import BeforeAfterSection from './components/home/BeforeAfterSection'
import ClinicSection from './components/home/ClinicSection'

const App = () => {
  return (
    <>
      <Header />
      <QuickMenu />
      <main>
        <HeroSection />
        <TreatmentSection />
        <BestSellerSection />
        <SpecialSection />
        <BeforeAfterSection />
        <ClinicSection />
      </main>
      <Footer />
    </>
  )
}

export default App
