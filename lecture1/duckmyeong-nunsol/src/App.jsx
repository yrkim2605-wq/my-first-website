import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingMenu from './components/layout/FloatingMenu'
import CategoryCards from './components/home/CategoryCards'
import HeroSection from './components/home/HeroSection'
import ProductSection from './components/home/ProductSection'
import BrandSection from './components/home/BrandSection'
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
        <ServiceStrip />
      </main>
      <Footer />
      <FloatingMenu />
    </>
  )
}

export default App
