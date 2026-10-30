import { useState } from 'react'
import { Box, Button, Chip, Container, Link, Tab, Tabs, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import ProductCard from '../common/ProductCard'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { PRODUCT_TABS, PRODUCTS, getOriginalListUrl } from '../../constants/siteData'
import { ALL_PRODUCTS, PRODUCT_CATEGORIES, getCategoryName, searchProducts } from '../../utils/productSearch'

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
  gap: 2,
}

const ProductSection = ({ filter, isFiltering, onShowAll, onClear }) => {
  const [selectedTab, setSelectedTab] = useState(PRODUCT_TABS[0])

  const handleTabChange = (event, value) => {
    setSelectedTab(value)
  }

  const { query, categoryId, isShowAll } = filter
  const products = isShowAll ? ALL_PRODUCTS : isFiltering ? searchProducts(query, categoryId) : PRODUCTS[selectedTab]

  // 검색·카테고리 필터가 켜져 있을 때 제목 옆에 보여줄 조건 칩
  // 분류만 골랐을 때는 제목을 분류명으로, 그 분류의 기존 쇼핑몰 목록 주소도 함께 제공
  const category = PRODUCT_CATEGORIES.find(({ id }) => id === categoryId)
  const isCategoryOnly = Boolean(categoryId) && !query
  const originalListUrl = category ? getOriginalListUrl(category.listId) : null
  const conditionChips = [query && `검색어: ${query}`, categoryId && `분류: ${getCategoryName(categoryId)}`].filter(Boolean)

  return (
    <Container id="products" maxWidth="lg" sx={{ pt: { xs: 5, md: 6 }, pb: { xs: 5, md: 6 }, scrollMarginTop: 16 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h2">
          {isShowAll ? '전체 상품' : isCategoryOnly ? category.name : isFiltering ? '상품 찾기 결과' : '추천 상품'}
        </Typography>

        {isFiltering ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {conditionChips.map((chip) => (
              <Chip key={chip} label={chip} size="small" color="primary" variant="outlined" />
            ))}
            {/* 결과 개수를 스크린리더에도 알려줌 */}
            <Typography role="status" variant="body2" color="text.secondary">
              {products.length}개
            </Typography>
            {originalListUrl && (
              <Link
                href={originalListUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                variant="body2"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color: 'primary.dark' }}
              >
                기존 쇼핑몰에서 전체 상품 보기
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </Link>
            )}
          </Box>
        ) : (
          // 선택된 탭: 오렌지 + 굵게 + 두꺼운 밑줄 / 선택 안 된 탭: 회색
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
        )}

        {isFiltering ? (
          <Button color="inherit" size="small" onClick={onClear} sx={{ ml: 'auto' }}>
            필터 해제
          </Button>
        ) : (
          <Button
            color="inherit"
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={onShowAll}
            sx={{ ml: 'auto', order: { xs: 2, md: 3 } }}
          >
            전체보기
          </Button>
        )}
      </Box>

      {products.length > 0 ? (
        <Box sx={GRID_SX}>
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 8,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <SearchOffIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
            {isCategoryOnly ? `${category.name} 상품이 아직 준비되지 않았어요` : '조건에 맞는 상품이 없어요'}
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'keep-all', px: 2 }}>
            {isCategoryOnly
              ? '기존 쇼핑몰에서 이 분류의 전체 상품을 보실 수 있어요. 대표전화 1644-9879로 문의하셔도 안내해 드려요.'
              : '찾으시는 제품은 대표전화 1644-9879로 문의해 주시면 안내해 드려요.'}
          </Typography>
          {isCategoryOnly && (
            <Button
              component="a"
              href={originalListUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              endIcon={<OpenInNewIcon />}
              sx={{ mt: 1 }}
            >
              기존 쇼핑몰에서 보기
            </Button>
          )}
          <Button variant="outlined" onClick={onClear} sx={{ mt: 1 }}>
            필터 해제하고 전체 보기
          </Button>
        </Box>
      )}
    </Container>
  )
}

export default ProductSection
