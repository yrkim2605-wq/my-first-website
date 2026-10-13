import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import BakeryStageCard from '../components/common/BakeryStageCard'
import PopularBakeryCarousel from '../components/common/PopularBakeryCarousel'
import PopularReviewCarousel from '../components/common/PopularReviewCarousel'
import ScrollFillText from '../components/common/ScrollFillText'
import InfiniteBakeryMarquee from '../components/common/InfiniteBakeryMarquee'
import HeroCarousel from '../components/common/HeroCarousel'
import Reveal from '../components/common/Reveal'
import SectionHeading from '../components/common/SectionHeading'
import ScallopEdge from '../components/common/decor/ScallopEdge'
import FlatFlower from '../components/common/decor/FlatFlower'
import StatusMessage from '../components/common/StatusMessage'
import BakeryCardSkeleton from '../components/common/BakeryCardSkeleton'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS, REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { FILTER_CHIP_SX } from '../constants/chipStyles'
import { getAuthorLevel } from '../utils/authorLevel'
import { useBusanBakeries } from '../hooks/useBusanBakeries'
import heroImage1 from '../assets/hero/bakery-1.webp'
import heroImage2 from '../assets/hero/bakery-2.webp'

const HERO_IMAGES = [heroImage1, heroImage2]

// "전체 빵집"은 처음에 이만큼만 보여주고, "빵집 더 보기"로 같은 수만큼 이어서 보여줘요.
const BAKERY_PAGE_SIZE = 12

const FULL_BLEED_SX = {
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
}

const SECTION_PY = { xs: 7, md: 10 }
const SECTION_PX = { xs: 3, sm: 6, md: 6, lg: 8 }

const POPULAR_REVIEWS = [...BAKERY_REVIEWS]
  .sort((a, b) => b.heartCount - a.heartCount)
  .slice(0, 8)
  .map((review) => ({
    ...review,
    bakery: BAKERIES.find((b) => b.id === review.bakeryId),
    avatarImage: getAuthorLevel(review.author).iconImage,
    avatarScale: getAuthorLevel(review.author).iconScale,
  }))

const Home = () => {
  const theme = useTheme()
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(BAKERY_PAGE_SIZE)
  const {
    bakeries: realBakeries,
    loading: bakeriesLoading,
    error: bakeriesError,
    reload: reloadBakeries,
  } = useBusanBakeries()

  const { palette } = theme
  const sageColor = palette.secondary.main
  const wineColor = palette.primary.main

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
  const visibleBakeries = filteredBakeries.slice(0, visibleCount)

  // 지역이나 검색어가 바뀌면 다시 첫 12곳부터 보여줘요.
  const handleSelectDistrict = (districtId) => {
    setSelectedDistrictId(districtId)
    setVisibleCount(BAKERY_PAGE_SIZE)
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
    setVisibleCount(BAKERY_PAGE_SIZE)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDistrictId(null)
    setVisibleCount(BAKERY_PAGE_SIZE)
  }

  const bakeriesErrorMessage = (
    <StatusMessage
      title="빵집 정보를 불러오지 못했어요"
      description="잠시 후 다시 시도해주세요."
      actionLabel="다시 시도"
      onAction={reloadBakeries}
    />
  )

  return (
    <>
      <HeroCarousel images={HERO_IMAGES}>
        <Reveal distance={28} sx={{ width: '100%' }}>
          <Container maxWidth="lg">
            <Typography
              sx={{
                color: 'rgba(251,246,234,0.8)',
                textAlign: 'center',
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: 700,
                letterSpacing: '0.18em',
                mb: { xs: 2.5, sm: 3 },
              }}
            >
              BUSAN BAKERY COMMUNITY
            </Typography>
            <Typography
              component="div"
              sx={{
                textAlign: 'center',
                fontFamily: theme.typography.h1.fontFamily,
                fontWeight: 900,
                lineHeight: 1.4,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
                wordBreak: 'keep-all',
              }}
            >
              <ScrollFillText>
                한 줄의 리뷰가 누군가의 최고의 선택이 됩니다.
                <br />
                빵덕후와 함께 성장하는 공간입니다.
              </ScrollFillText>
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, sm: 5 } }}>
              <Button
                component={Link}
                to="/community"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 3, py: 1.1, borderRadius: 999 }}
              >
                커뮤니티 둘러보기
              </Button>
            </Box>
          </Container>
        </Reveal>
      </HeroCarousel>

      {/* 오늘 인기 빵집 */}
      <Box sx={{ py: SECTION_PY }}>
        <SectionHeading
          eyebrow="TODAY'S PICK"
          title="오늘 인기 빵집"
          description="부산 빵덕후들이 오늘 가장 많이 찾은 곳이에요."
          sx={{ mb: { xs: 4, md: 5 }, px: 2 }}
        />
        <Box sx={{ ...FULL_BLEED_SX, px: SECTION_PX }}>
          {bakeriesLoading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{ display: { xs: i === 0 ? 'block' : 'none', md: 'block' } }}>
                  <BakeryCardSkeleton />
                </Box>
              ))}
            </Box>
          )}
          {bakeriesError && <Container maxWidth="md">{bakeriesErrorMessage}</Container>}
          {!bakeriesLoading && !bakeriesError && popularBakeries.length > 0 && (
            <PopularBakeryCarousel bakeries={carouselBakeries} />
          )}
        </Box>
      </Box>

      {/* 이번 주 인기 리뷰: 세이지 색 블록 */}
      <Box sx={{ ...FULL_BLEED_SX }}>
        <ScallopEdge color={sageColor} position="top" />
        <Box sx={{ position: 'relative', bgcolor: 'secondary.main', py: SECTION_PY, overflow: 'hidden' }}>
          <FlatFlower petal={palette.background.paper} center={palette.mustard.main} size={72} sx={{ position: 'absolute', top: 36, left: { xs: -18, md: 64 }, opacity: 0.9 }} />
          <FlatFlower petal={palette.terracotta.main} center={palette.background.paper} size={44} sx={{ position: 'absolute', top: 118, left: { xs: 40, md: 150 } }} />
          <FlatFlower petal={palette.primary.main} center={palette.mustard.main} size={56} sx={{ position: 'absolute', top: 44, right: { xs: -12, md: 90 } }} />
          <SectionHeading
            eyebrow="WEEKLY REVIEWS"
            title="이번 주 인기 리뷰"
            description="한 줄의 리뷰가 누군가의 최고의 선택이 돼요."
            tone="onColor"
            sx={{ mb: { xs: 4, md: 5 }, px: 2, position: 'relative' }}
          />
          <Box sx={{ px: SECTION_PX, position: 'relative' }}>
            <PopularReviewCarousel reviews={POPULAR_REVIEWS} />
          </Box>
        </Box>
        <ScallopEdge color={sageColor} position="bottom" />
      </Box>

      {/* 새로 등록된 빵집 (오류일 때는 위에서 한 번만 안내하고 숨겨요) */}
      {!bakeriesError && (
        <Box sx={{ py: SECTION_PY }}>
          <SectionHeading
            eyebrow="NEW IN BUSAN"
            title="새로 등록된 빵집"
            description="새로 문을 연 빵집을 가장 먼저 만나보세요."
            sx={{ mb: { xs: 4, md: 5 }, px: 2 }}
          />
          {bakeriesLoading ? (
            <Box sx={{ ...FULL_BLEED_SX, px: SECTION_PX }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: { xs: i < 2 ? 'block' : 'none', md: 'block' } }}>
                    <BakeryCardSkeleton />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ ...FULL_BLEED_SX }}>
              <InfiniteBakeryMarquee bakeries={marqueeBakeries} />
            </Box>
          )}
        </Box>
      )}

      {/* 빵집 찾기: 와인 색 블록 + 검색 */}
      <Box sx={{ ...FULL_BLEED_SX }}>
        <Box sx={{ position: 'relative', bgcolor: 'primary.main', pt: SECTION_PY, pb: { xs: 5, md: 6 }, overflow: 'hidden' }}>
          <FlatFlower petal={palette.mustard.main} center={palette.primary.main} size={60} sx={{ position: 'absolute', top: 28, right: { xs: -16, md: 120 } }} />
          <FlatFlower petal={palette.background.paper} center={palette.terracotta.main} size={40} sx={{ position: 'absolute', bottom: 24, left: { xs: 12, md: 110 }, opacity: 0.9 }} />
          <Container maxWidth="sm" sx={{ position: 'relative' }}>
            <SectionHeading
              eyebrow="FIND YOUR BAKERY"
              title="부산 빵집 찾기"
              description="빵집 이름이나 먹고 싶은 메뉴로 찾아보세요."
              tone="onColor"
              sx={{ mb: 3 }}
            />
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="예: 소금빵, 해운대, 크루아상"
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  backgroundColor: 'background.paper',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'mustard.main' },
                  '&.Mui-focused fieldset': { borderColor: 'mustard.main', borderWidth: 2 },
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
          </Container>
        </Box>
        <ScallopEdge color={wineColor} position="bottom" />
      </Box>

      {/* 전체 빵집 */}
      <Container maxWidth="xl">
        <Box sx={{ pt: { xs: 5, md: 7 }, pb: SECTION_PY }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h2" sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '1.8rem' } }}>
                {selectedDistrict ? `${selectedDistrict.name} 빵집` : '전체 빵집'}
              </Typography>
              {!bakeriesLoading && !bakeriesError && (
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 0.5 }}>
                  {filteredBakeries.length}곳
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="전체"
                variant={!selectedDistrictId ? 'filled' : 'outlined'}
                color={!selectedDistrictId ? 'primary' : 'default'}
                onClick={() => handleSelectDistrict(null)}
                sx={FILTER_CHIP_SX}
              />
              {DISTRICTS.map((district) => (
                <Chip
                  key={district.id}
                  label={district.name}
                  variant={selectedDistrictId === district.id ? 'filled' : 'outlined'}
                  color={selectedDistrictId === district.id ? 'primary' : 'default'}
                  onClick={() => handleSelectDistrict(district.id)}
                  sx={FILTER_CHIP_SX}
                />
              ))}
            </Box>
          </Box>

          {bakeriesError && bakeriesErrorMessage}
          {!bakeriesLoading && !bakeriesError && filteredBakeries.length === 0 && (
            <StatusMessage
              title="조건에 맞는 빵집이 없어요"
              description="다른 지역을 고르거나 검색어를 바꿔보세요."
              actionLabel="검색 초기화"
              onAction={handleResetFilters}
            />
          )}
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
            {bakeriesLoading &&
              Array.from({ length: 8 }, (_, i) => <BakeryCardSkeleton key={i} />)}
            {!bakeriesLoading &&
              !bakeriesError &&
              visibleBakeries.map((bakery) => (
                <BakeryStageCard
                  key={bakery.id}
                  {...bakery}
                  districtLabel={DISTRICTS.find((d) => d.id === bakery.districtId)?.name}
                  reviewCount={REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0}
                  isNew={newBakeryIds.has(bakery.id)}
                />
              ))}
          </Box>

          {!bakeriesLoading && !bakeriesError && visibleCount < filteredBakeries.length && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant="outlined"
                onClick={() => setVisibleCount((count) => count + BAKERY_PAGE_SIZE)}
                sx={{ px: 4, py: 1.1, borderRadius: 999, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
              >
                빵집 더 보기 ({visibleBakeries.length} / {filteredBakeries.length})
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}

export default Home
