import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingMenu from './components/layout/FloatingMenu'
import ContactBar from './components/layout/ContactBar'
import CategoryCards from './components/home/CategoryCards'
import HeroSection from './components/home/HeroSection'
import ProductSection from './components/home/ProductSection'
import BrandSection from './components/home/BrandSection'
import CompanyIntro from './components/home/CompanyIntro'
import ServiceStrip from './components/home/ServiceStrip'

const App = () => {
  return (
    <>
      <Header />
      <main>
        <CategoryCards />
        <HeroSection />
        <ProductSection />
        <BrandSection />
        <CompanyIntro />
        <ServiceStrip />
      </main>
      <Footer />
      <ContactBar />
      <FloatingMenu />
    </>
  )
}

export default App
