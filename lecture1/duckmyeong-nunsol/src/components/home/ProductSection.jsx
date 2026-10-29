import { useState } from 'react'
import { Box, Button, Container, Tab, Tabs, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ProductCard from '../common/ProductCard'
import { PRODUCT_TABS, PRODUCTS } from '../../constants/siteData'

const ProductSection = () => {
  const [selectedTab, setSelectedTab] = useState(PRODUCT_TABS[0])

  const handleTabChange = (event, value) => {
    setSelectedTab(value)
  }

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 6 }, pb: { xs: 5, md: 6 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h2">추천 상품</Typography>
        {/* 선택된 탭: 오렌지 + 굵게 + 두꺼운 밑줄 / 선택 안 된 탭: 회색 */}
        <Tabs
          value={selectedTab}
          variant="scrollable"
          scrollButtons={false}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            // 모바일: 제목 줄 아래에 탭이 전체 폭으로 / 데스크톱: 제목 옆
            order: { xs: 3, md: 2 },
            width: { xs: '100%', md: 'auto' },
            '& .MuiTabs-indicator': { height: 3 },
            '& .MuiTab-root': { color: 'text.secondary', fontWeight: 500, fontSize: '1rem' },
            '& .MuiTab-root.Mui-selected': { color: 'primary.main', fontWeight: 700 },
          }}
        >
          {PRODUCT_TABS.map((tab) => (
            <Tab key={tab} value={tab} label={tab} />
          ))}
        </Tabs>
        <Button color="inherit" size="small" endIcon={<ArrowForwardIcon />} sx={{ ml: 'auto', order: { xs: 2, md: 3 } }}>
          전체보기
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {PRODUCTS[selectedTab].map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </Box>
    </Container>
  )
}

export default ProductSection
