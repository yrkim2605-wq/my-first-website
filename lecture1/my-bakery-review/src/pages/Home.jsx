import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import BakeryStageCard from '../components/common/BakeryStageCard'
import PopularReviewCard from '../components/common/PopularReviewCard'
import HeroCarousel from '../components/common/HeroCarousel'
import Reveal from '../components/common/Reveal'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS, REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { getAuthorLevel } from '../utils/authorLevel'
import heroImage1 from '../assets/hero/bakery-1.jpg'
import heroImage2 from '../assets/hero/bakery-2.jpg'
import heroGinghamBg from '../assets/hero/gingham-bg.jpg'
import waveBottom from '../assets/hero/wave-bottom.svg'

const HERO_IMAGES = [heroImage1, heroImage2]

const SECTION_TITLE_SX = {
  fontFamily: '"OwnglyphParkDaHyun", cursive',
  color: '#205A41',
  fontWeight: 400,
  letterSpacing: '-0.01em',
}

const FILTER_CHIP_SX = {
  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    backgroundColor: '#205A41 !important',
    color: '#F0EDE6 !important',
    borderColor: '#205A41 !important',
  },
}

const SCROLL_ROW_SX = {
  display: 'flex',
  gap: 2.5,
  overflowX: 'auto',
  pb: 1.5,
  '&::-webkit-scrollbar': { height: 6 },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(46,42,37,0.15)',
    borderRadius: 999,
  },
}

const POPULAR_BAKERIES = [...BAKERIES]
  .sort((a, b) => b.rating - a.rating || b.heartCount - a.heartCount)
  .slice(0, 5)

const NEW_BAKERIES = [...BAKERIES].sort((a, b) => b.id - a.id).slice(0, 5)
const NEW_BAKERY_IDS = new Set(NEW_BAKERIES.map((b) => b.id))

const POPULAR_REVIEWS = [...BAKERY_REVIEWS]
  .sort((a, b) => b.heartCount - a.heartCount)
  .slice(0, 4)
  .map((review) => ({
    ...review,
    bakery: BAKERIES.find((b) => b.id === review.bakeryId),
  }))

const Home = () => {
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredBakeries = BAKERIES.filter((b) => {
    const matchesDistrict = !selectedDistrictId || b.districtId === selectedDistrictId
    const matchesQuery =
      !normalizedQuery ||
      b.name.toLowerCase().includes(normalizedQuery) ||
      b.signatureMenu.toLowerCase().includes(normalizedQuery) ||
      b.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    return matchesDistrict && matchesQuery
  })

  const renderBakeryCard = (bakery, { width, index = 0 } = {}) => {
    const district = DISTRICTS.find((d) => d.id === bakery.districtId)
    const delay = Math.min(index * 0.05, 0.3)
    const card = (
      <BakeryStageCard
        {...bakery}
        districtLabel={district?.name}
        reviewCount={REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0}
        isNew={NEW_BAKERY_IDS.has(bakery.id)}
      />
    )
    return (
      <Reveal key={bakery.id} delay={delay} sx={width ? { flex: `0 0 ${width}px` } : undefined}>
        {card}
      </Reveal>
    )
  }

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          backgroundImage: `url(${heroGinghamBg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: { xs: '40px 40px', sm: '56px 56px' },
          backgroundAttachment: 'fixed',
          backgroundPosition: 'top left',
          pt: { xs: 4, sm: 6 },
          pb: { xs: '52px', sm: '72px' },
        }}
      >
        <Container maxWidth="xl">
          <HeroCarousel images={HERO_IMAGES} />
        </Container>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: { xs: 45, sm: 63 },
            backgroundImage: `url(${waveBottom})`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            backgroundSize: { xs: '150px 45px', sm: '210px 63px' },
          }}
        />
      </Box>

      <Box
        sx={{
          bgcolor: '#FEECC5',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          py: { xs: 7, sm: 10 },
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2, fontSize: '1.9rem' }}>
            🔥 오늘 인기 빵집
          </Typography>
          <Box sx={SCROLL_ROW_SX}>
            {POPULAR_BAKERIES.map((bakery, index) => renderBakeryCard(bakery, { width: 260, index }))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
      <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 12, sm: 18 } }}>
          <Box>
            <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2, fontSize: '1.9rem' }}>
              ⭐ 이번 주 인기 리뷰
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2.5,
              }}
            >
              {POPULAR_REVIEWS.map((review, index) => (
                <Reveal key={review.id} delay={Math.min(index * 0.05, 0.3)}>
                  <PopularReviewCard
                    bakeryId={review.bakeryId}
                    bakeryName={review.bakery?.name}
                    bakeryEmoji={review.bakery?.emoji}
                    bakeryIconImage={review.bakery?.iconImage}
                    avatarEmoji={review.avatarEmoji}
                    avatarImage={getAuthorLevel(review.author).iconImage}
                    author={review.author}
                    rating={review.rating}
                    content={review.content}
                  />
                </Reveal>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2, fontSize: '1.9rem' }}>
              🥐 새로 등록된 빵집
            </Typography>
            <Box sx={SCROLL_ROW_SX}>
              {NEW_BAKERIES.map((bakery, index) => renderBakeryCard(bakery, { width: 260, index }))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            bgcolor: '#FFE373',
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            mt: { xs: 7, sm: 9 },
            py: { xs: 4, sm: 6 },
          }}
        >
        <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 6, sm: 8 } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="빵집 이름이나 메뉴를 검색해보세요"
            variant="standard"
            sx={{
              maxWidth: 420,
              width: '100%',
              '& .MuiInput-underline:before': {
                borderBottomColor: 'text.primary',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'primary.main',
              },
              '& .MuiInput-underline:after': {
                borderBottomColor: 'primary.main',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h2" sx={SECTION_TITLE_SX}>
              {selectedDistrict ? selectedDistrict.name : '전체'} 빵집
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              label="전체"
              variant={!selectedDistrictId ? 'filled' : 'outlined'}
              color={!selectedDistrictId ? 'primary' : 'default'}
              onClick={() => setSelectedDistrictId(null)}
              sx={FILTER_CHIP_SX}
            />
            {DISTRICTS.map((district) => (
              <Chip
                key={district.id}
                label={district.name}
                variant={selectedDistrictId === district.id ? 'filled' : 'outlined'}
                color={selectedDistrictId === district.id ? 'primary' : 'default'}
                onClick={() => setSelectedDistrictId(district.id)}
                sx={FILTER_CHIP_SX}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredBakeries.map((bakery, index) => renderBakeryCard(bakery, { index: index % 8 }))}
          </Box>
        </Box>
        </Container>
        </Box>
      </Box>
      </Container>
    </>
  )
}

export default Home
