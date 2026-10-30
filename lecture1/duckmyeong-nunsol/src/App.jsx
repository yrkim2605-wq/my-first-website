import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingMenu from './components/layout/FloatingMenu'
import CategoryCards from './components/home/CategoryCards'
import HeroSection from './components/home/HeroSection'
import ProductSection from './components/home/ProductSection'
import BrandSection from './components/home/BrandSection'
import CompanyIntro from './components/home/CompanyIntro'
import useProductFilter from './hooks/useProductFilter'

const App = () => {
  const { filter, isFiltering, search, toggleCategory, showAll, clear } = useProductFilter()

  return (
    <>
      <Header query={filter.query} onSearch={search} />
      <main>
        <CategoryCards selectedId={filter.categoryId} onSelect={toggleCategory} />
        <HeroSection />
        <ProductSection filter={filter} isFiltering={isFiltering} onShowAll={showAll} onClear={clear} />
        <BrandSection />
        <CompanyIntro />
      </main>
      <Footer />
      <FloatingMenu />
    </>
  )
}

export default App
