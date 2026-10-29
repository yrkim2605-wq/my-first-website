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
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h2">오늘의 추천 상품</Typography>
        <Tabs value={selectedTab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          {PRODUCT_TABS.map((tab) => (
            <Tab key={tab} value={tab} label={tab} />
          ))}
        </Tabs>
        <Button color="inherit" size="small" endIcon={<ArrowForwardIcon />} sx={{ ml: 'auto' }}>
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
