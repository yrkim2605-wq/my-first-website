import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BakeryStageCard from '../components/common/BakeryStageCard'
import PopularReviewCard from '../components/common/PopularReviewCard'
import HeroCarousel from '../components/common/HeroCarousel'
import Reveal from '../components/common/Reveal'
import RevealText from '../components/common/RevealText'
import SectionDecor from '../components/common/SectionDecor'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS, REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { FILTER_CHIP_SX } from '../constants/chipStyles'
import { getAuthorLevel } from '../utils/authorLevel'
import { useBusanBakeries } from '../context/BusanBakeriesContext'
import heroImage1 from '../assets/hero/bakery-1.jpg'
import heroImage2 from '../assets/hero/bakery-2.jpg'
import iconFire from '../assets/section-icons/icon-fire.png'
import iconStar from '../assets/section-icons/icon-star.png'
import iconCroissant from '../assets/section-icons/icon-croissant.png'
import iconDefaultBakery from '../assets/section-icons/icon-default-bakery.png'
import decoSaltBread from '../assets/decorative/deco-salt-bread.jpg'
import decoEggTart from '../assets/decorative/deco-egg-tart.jpg'
import decoStrawberryChoux from '../assets/decorative/deco-strawberry-choux.jpg'
import decoStrawberryCake from '../assets/decorative/deco-strawberry-cake.jpg'
import decoCoconutBread from '../assets/decorative/deco-coconut-bread.jpg'

const HERO_IMAGES = [heroImage1, heroImage2]

const TODAY_POPULAR_DECOR = [{ src: decoSaltBread, size: 120, top: 24, right: 64, rotate: -9 }]
const WEEKLY_REVIEW_DECOR = [{ src: decoEggTart, size: 110, top: 28, left: 64, rotate: 8 }]
const NEW_BAKERY_DECOR = [{ src: decoStrawberryChoux, size: 128, top: 20, right: 72, rotate: -7 }]
const ALL_BAKERY_DECOR = [{ src: decoStrawberryCake, size: 122, top: 140, left: 64, rotate: 7 }]

const SECTION_TITLE_SX = {
  color: '#205A41',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
}

const SECTION_ICON_SX = {
  width: '1.5em',
  height: '1.5em',
  objectFit: 'contain',
  flexShrink: 0,
}

// icon-croissant.png / icon-default-bakery.png have a lot of transparent padding
// baked into the source art, so they need a bigger box to read at the same visual size.
const SECTION_ICON_PADDED_SX = {
  ...SECTION_ICON_SX,
  width: '2.1em',
  height: '2.1em',
}

const FULL_BLEED_SX = {
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  px: { xs: 2, sm: 3 },
}

const SCROLL_ROW_SX = {
  display: 'flex',
  gap: 2.5,
  overflowX: 'auto',
  pb: 1.5,
  scrollSnapType: 'x proximity',
  '& > *': { scrollSnapAlign: 'start' },
  '&::-webkit-scrollbar': { height: 6 },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(46,42,37,0.15)',
    borderRadius: 999,
  },
}


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
  const { bakeries: realBakeries, loading: bakeriesLoading, error: bakeriesError } = useBusanBakeries()

  const selectedDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const popularBakeries = useMemo(() => realBakeries.slice(0, 5), [realBakeries])
  const newBakeries = useMemo(() => [...realBakeries].reverse().slice(0, 5), [realBakeries])
  const newBakeryIds = useMemo(() => new Set(newBakeries.map((b) => b.id)), [newBakeries])

  const filteredBakeries = realBakeries.filter((b) => {
    const matchesDistrict = !selectedDistrictId || b.districtId === selectedDistrictId
    const matchesQuery =
      !normalizedQuery ||
      b.name.toLowerCase().includes(normalizedQuery) ||
      b.signatureMenu.toLowerCase().includes(normalizedQuery) ||
      b.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    return matchesDistrict && matchesQuery
  })

  const renderBakeryCard = (bakery, { fillRow = false, index = 0, variant = 'default' } = {}) => {
    const district = DISTRICTS.find((d) => d.id === bakery.districtId)
    const delay = Math.min(index * 0.05, 0.3)
    const card = (
      <BakeryStageCard
        {...bakery}
        districtLabel={district?.name}
        reviewCount={REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0}
        isNew={newBakeryIds.has(bakery.id)}
        variant={variant}
      />
    )
    return (
      <Reveal key={bakery.id} delay={delay} sx={fillRow ? { flex: '1 1 220px', minWidth: 220 } : undefined}>
        {card}
      </Reveal>
    )
  }

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <HeroCarousel images={HERO_IMAGES} />
      </Box>

      <Reveal distance={28}>
        <Container maxWidth="md">
          <Box sx={{ pt: { xs: 22, sm: 38 }, pb: { xs: 22, sm: 38 } }}>
            <Typography
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
                lineHeight: 1.7,
                fontSize: { xs: '1.15rem', sm: '1.4rem' },
                fontWeight: 500,
              }}
            >
              오늘도 새로운 빵을 만나고, 좋은 빵집을 함께 나누세요.
              <br />
              한 줄의 리뷰가 누군가의 최고의 선택이 됩니다. 빵덕후와 함께 성장하는 공간입니다.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Box
                component={Link}
                to="/community"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease, color 0.2s ease',
                  '&:hover': {
                    gap: 1,
                    color: '#123B29',
                  },
                }}
              >
                자세히 보기
                <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Reveal>

      <Box sx={{ position: 'relative', py: { xs: 8, sm: 10 } }}>
        <SectionDecor stickers={TODAY_POPULAR_DECOR} />
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2 }}>
            <Box component="img" src={iconFire} alt="" sx={SECTION_ICON_SX} />
            <RevealText text="오늘 인기 빵집" />
          </Typography>
          {bakeriesLoading && (
            <Typography color="text.secondary">부산 빵집 정보를 불러오는 중이에요...</Typography>
          )}
          {bakeriesError && (
            <Typography color="error">빵집 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Typography>
          )}
        </Container>
        {!bakeriesLoading && !bakeriesError && popularBakeries.length > 0 && (
          <Box
            sx={{
              ...FULL_BLEED_SX,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              alignItems: 'start',
              gap: 2.5,
            }}
          >
            <Reveal>
              <BakeryStageCard
                {...popularBakeries[0]}
                districtLabel={DISTRICTS.find((d) => d.id === popularBakeries[0].districtId)?.name}
                reviewCount={REVIEW_COUNT_BY_BAKERY_ID[popularBakeries[0].id] || 0}
                isNew={newBakeryIds.has(popularBakeries[0].id)}
                variant="featured"
              />
            </Reveal>
            {popularBakeries[1] && renderBakeryCard(popularBakeries[1], { index: 1, variant: 'square' })}
          </Box>
        )}
      </Box>

      <Box sx={{ position: 'relative', py: { xs: 8, sm: 10 } }}>
        <SectionDecor stickers={WEEKLY_REVIEW_DECOR} />
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2 }}>
            <Box component="img" src={iconStar} alt="" sx={SECTION_ICON_SX} />
            <RevealText text="이번 주 인기 리뷰" />
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
        </Container>
      </Box>

      <Box sx={{ position: 'relative', py: { xs: 8, sm: 10 } }}>
        <SectionDecor stickers={NEW_BAKERY_DECOR} />
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2 }}>
            <Box component="img" src={iconCroissant} alt="" sx={SECTION_ICON_PADDED_SX} />
            <RevealText text="새로 등록된 빵집" />
          </Typography>
          <Box sx={SCROLL_ROW_SX}>
            {bakeriesLoading && (
              <Typography color="text.secondary">부산 빵집 정보를 불러오는 중이에요...</Typography>
            )}
            {bakeriesError && (
              <Typography color="error">빵집 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Typography>
            )}
            {!bakeriesLoading &&
              !bakeriesError &&
              newBakeries.map((bakery, index) => renderBakeryCard(bakery, { fillRow: true, index }))}
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          bgcolor: '#F7F1E6',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <SectionDecor stickers={ALL_BAKERY_DECOR} />
        <Box
          sx={{
            bgcolor: '#FFE373',
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            py: { xs: 4, sm: 6 },
            borderRadius: { xs: '50% 50% 0 0 / 56px 56px 0 0', sm: '50% 50% 0 0 / 96px 96px 0 0' },
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <TextField
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="빵집 이름이나 메뉴를 검색해보세요"
                variant="outlined"
                sx={{
                  maxWidth: 420,
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    backgroundColor: '#FFFDF6',
                    boxShadow: '0 2px 8px rgba(46,42,37,0.08)',
                    '& fieldset': {
                      borderColor: '#E3B873',
                      borderWidth: 2,
                      transition: 'border-color 0.35s ease',
                    },
                    '&:hover fieldset': {
                      borderColor: '#205A41',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#205A41',
                      borderWidth: 2,
                    },
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
          </Container>
        </Box>

        <Container maxWidth="xl">
          <Box sx={{ pt: { xs: 6, sm: 8 }, pb: { xs: 7, sm: 10 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h2" sx={SECTION_TITLE_SX}>
                <Box component="img" src={iconDefaultBakery} alt="" sx={SECTION_ICON_PADDED_SX} />
                <RevealText key={selectedDistrictId || 'all'} text={`${selectedDistrict ? selectedDistrict.name : '전체'} 빵집`} />
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
              {bakeriesLoading && (
                <Typography color="text.secondary">부산 빵집 정보를 불러오는 중이에요...</Typography>
              )}
              {bakeriesError && (
                <Typography color="error">빵집 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Typography>
              )}
              {!bakeriesLoading &&
                !bakeriesError &&
                filteredBakeries.map((bakery, index) => renderBakeryCard(bakery, { index: index % 8 }))}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  )
}

export default Home
