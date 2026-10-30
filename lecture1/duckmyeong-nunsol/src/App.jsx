import { Box } from '@mui/material'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingMenu from './components/layout/FloatingMenu'
import CategoryCards from './components/home/CategoryCards'
import HeroSection from './components/home/HeroSection'
import ProductSection from './components/home/ProductSection'
import BrandSection from './components/home/BrandSection'
import CompanyIntro from './components/home/CompanyIntro'
import Reveal from './components/common/Reveal'
import useProductFilter from './hooks/useProductFilter'

const App = () => {
  const { filter, isFiltering, search, selectCategory, toggleCategory, showAll, clear } = useProductFilter()

  return (
    <>
      {/* 키보드 사용자가 반복되는 메뉴를 건너뛰고 본문으로 바로 가는 링크 (Tab 키를 처음 누르면 나타남) */}
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: 16,
          top: -100,
          zIndex: 2000,
          px: 2,
          py: 1,
          bgcolor: 'secondary.main',
          color: '#fff',
          borderRadius: 1,
          '&:focus': { top: 16 },
        }}
      >
        본문 바로가기
      </Box>
      <Header query={filter.query} onSearch={search} onSelectCategory={selectCategory} />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <CategoryCards selectedId={filter.categoryId} onSelect={toggleCategory} />
        <HeroSection />
        <Reveal>
          <ProductSection filter={filter} isFiltering={isFiltering} onShowAll={showAll} onClear={clear} />
        </Reveal>
        <Reveal>
          <BrandSection onSelectBrand={search} onShowAll={showAll} />
        </Reveal>
        <Reveal>
          <CompanyIntro />
        </Reveal>
      </main>
      <Footer />
      <FloatingMenu />
    </>
  )
}

export default App
