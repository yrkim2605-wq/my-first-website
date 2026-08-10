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
import PopularBakeryCarousel, { CAROUSEL_CARD_INSET } from '../components/common/PopularBakeryCarousel'
import PopularReviewCarousel from '../components/common/PopularReviewCarousel'
import ScrollFillText from '../components/common/ScrollFillText'
import InfiniteBakeryMarquee from '../components/common/InfiniteBakeryMarquee'
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
import decoEggTart from '../assets/decorative/deco-egg-tart.jpg'
import decoStrawberryChoux from '../assets/decorative/deco-strawberry-choux.jpg'
import decoStrawberryCake from '../assets/decorative/deco-strawberry-cake.jpg'
import decoCoconutBread from '../assets/decorative/deco-coconut-bread.jpg'

const HERO_IMAGES = [heroImage1, heroImage2]

const WEEKLY_REVIEW_DECOR = [{ src: decoEggTart, size: 68, top: -104, left: 64, rotate: 8 }]
const NEW_BAKERY_DECOR = [{ src: decoStrawberryChoux, size: 72, top: -104, right: 100, rotate: -7 }]
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
  px: { xs: 3, sm: 6, md: 10, lg: 16 },
}

const POPULAR_SECTION_PX = { xs: 3, sm: 6, md: 6, lg: 8 }


const POPULAR_REVIEWS = [...BAKERY_REVIEWS]
  .sort((a, b) => b.heartCount - a.heartCount)
  .slice(0, 8)
  .map((review) => ({
    ...review,
    bakery: BAKERIES.find((b) => b.id === review.bakeryId),
    avatarImage: getAuthorLevel(review.author).iconImage,
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

  const carouselBakeries = useMemo(
    () =>
      popularBakeries.map((bakery) => ({
        ...bakery,
        districtLabel: DISTRICTS.find((d) => d.id === bakery.districtId)?.name,
        reviewCount: REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0,
        isNew: newBakeryIds.has(bakery.id),
      })),
    [popularBakeries, newBakeryIds],
  )

  const marqueeBakeries = useMemo(
    () =>
      [...realBakeries]
        .reverse()
        .slice(0, 10)
        .map((bakery) => ({
          ...bakery,
          districtLabel: DISTRICTS.find((d) => d.id === bakery.districtId)?.name,
          reviewCount: REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0,
          isNew: newBakeryIds.has(bakery.id),
        })),
    [realBakeries, newBakeryIds],
  )

  const filteredBakeries = realBakeries.filter((b) => {
    const matchesDistrict = !selectedDistrictId || b.districtId === selectedDistrictId
    const matchesQuery =
      !normalizedQuery ||
      b.name.toLowerCase().includes(normalizedQuery) ||
      b.signatureMenu.toLowerCase().includes(normalizedQuery) ||
      b.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    return matchesDistrict && matchesQuery
  })

  const renderBakeryCard = (bakery, { index = 0, variant = 'default' } = {}) => {
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
      <Reveal key={bakery.id} delay={delay}>
        {card}
      </Reveal>
    )
  }

  return (
    <>
      <HeroCarousel images={HERO_IMAGES}>
        <Reveal distance={28} sx={{ width: '100%' }}>
          <Container maxWidth="md">
            <Typography
              sx={{
                color: 'rgba(255,251,244,0.75)',
                textAlign: 'center',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 500,
                mb: { xs: 3, sm: 4 },
              }}
            >
              오늘도 새로운 빵을 만나고, 좋은 빵집을 함께 나누세요.
            </Typography>
            <Typography
              component="div"
              sx={{
                textAlign: 'center',
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
                fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.6rem' },
              }}
            >
              <ScrollFillText>
                한 줄의 리뷰가 누군가의 최고의 선택이 됩니다.
                <br />
                빵덕후와 함께 성장하는 공간입니다.
              </ScrollFillText>
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, sm: 5 } }}>
              <Box
                component={Link}
                to="/community"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'rgba(255,251,244,0.85)',
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease, color 0.2s ease',
                  '&:hover': {
                    gap: 1,
                    color: '#FFFBF4',
                  },
                }}
              >
                자세히 보기
                <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
              </Box>
            </Box>
          </Container>
        </Reveal>
      </HeroCarousel>

      <Reveal distance={36}>
        <Box sx={{ position: 'relative', py: { xs: 8, sm: 10 } }}>
          <Box sx={{ ...FULL_BLEED_SX, px: POPULAR_SECTION_PX }}>
            <Box sx={{ position: 'relative', pl: CAROUSEL_CARD_INSET }}>
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
            </Box>
          </Box>
          {!bakeriesLoading && !bakeriesError && popularBakeries.length > 0 && (
            <Box sx={{ ...FULL_BLEED_SX, px: POPULAR_SECTION_PX }}>
              <PopularBakeryCarousel bakeries={carouselBakeries} />
            </Box>
          )}
        </Box>
      </Reveal>

      <Box sx={{ position: 'relative', pt: { xs: 20, sm: 26 }, pb: { xs: 8, sm: 10 } }}>
        <Box sx={{ ...FULL_BLEED_SX, px: POPULAR_SECTION_PX }}>
          <Box sx={{ position: 'relative', pl: CAROUSEL_CARD_INSET }}>
            <SectionDecor stickers={WEEKLY_REVIEW_DECOR} />
            <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2 }}>
              <Box component="img" src={iconStar} alt="" sx={SECTION_ICON_SX} />
              <RevealText text="이번 주 인기 리뷰" />
            </Typography>
          </Box>
          <PopularReviewCarousel reviews={POPULAR_REVIEWS} />
        </Box>
      </Box>

      <Box sx={{ position: 'relative', py: { xs: 8, sm: 10 } }}>
        <Box sx={{ ...FULL_BLEED_SX, px: POPULAR_SECTION_PX }}>
          <Box sx={{ position: 'relative' }}>
            <SectionDecor stickers={NEW_BAKERY_DECOR} />
            <Typography variant="h2" sx={{ ...SECTION_TITLE_SX, mb: 2 }}>
              <Box component="img" src={iconCroissant} alt="" sx={SECTION_ICON_PADDED_SX} />
              <RevealText text="새로 등록된 빵집" />
            </Typography>
            {bakeriesLoading && (
              <Typography color="text.secondary">부산 빵집 정보를 불러오는 중이에요...</Typography>
            )}
            {bakeriesError && (
              <Typography color="error">빵집 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</Typography>
            )}
          </Box>
        </Box>
        {!bakeriesLoading && !bakeriesError && (
          <Box sx={{ width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', mt: 1 }}>
            <InfiniteBakeryMarquee bakeries={marqueeBakeries} />
          </Box>
        )}
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
          mt: { xs: 10, sm: 14 },
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
