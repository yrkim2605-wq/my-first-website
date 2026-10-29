import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroSection from './components/home/HeroSection'
import CategoryCards from './components/home/CategoryCards'
import ProductSection from './components/home/ProductSection'
import BrandSection from './components/home/BrandSection'
import IndustrySection from './components/home/IndustrySection'

const App = () => {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CategoryCards />
        <ProductSection />
        <BrandSection />
        <IndustrySection />
      </main>
      <Footer />
    </>
  )
}

export default App
