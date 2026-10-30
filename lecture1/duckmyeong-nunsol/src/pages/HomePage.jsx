import CategoryCards from '../components/home/CategoryCards'
import HeroSection from '../components/home/HeroSection'
import ProductSection from '../components/home/ProductSection'
import BrandSection from '../components/home/BrandSection'
import CompanyIntro from '../components/home/CompanyIntro'
import Reveal from '../components/common/Reveal'

const HomePage = ({ filter, isFiltering, onSearch, onToggleCategory, onShowAll, onClear }) => {
  return (
    <>
      <CategoryCards selectedId={filter.categoryId} onSelect={onToggleCategory} />
      <HeroSection />
      <Reveal>
        <ProductSection filter={filter} isFiltering={isFiltering} onShowAll={onShowAll} onClear={onClear} />
      </Reveal>
      <Reveal>
        <BrandSection onSelectBrand={onSearch} onShowAll={onShowAll} />
      </Reveal>
      <Reveal>
        <CompanyIntro />
      </Reveal>
    </>
  )
}

export default HomePage
