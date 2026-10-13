import { useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import BakeryStageCard from '../components/common/BakeryStageCard'
import PopularBakeryCarousel from '../components/common/PopularBakeryCarousel'
import PopularReviewCarousel from '../components/common/PopularReviewCarousel'
import InfiniteBakeryMarquee from '../components/common/InfiniteBakeryMarquee'
import SectionHeading from '../components/common/SectionHeading'
import BakeryMapHero from '../components/home/BakeryMapHero'
import LevelUpTeaser from '../components/home/LevelUpTeaser'
import ScallopEdge from '../components/common/decor/ScallopEdge'
import FlatFlower from '../components/common/decor/FlatFlower'
import Illustration from '../components/common/decor/Illustration'
import HandNote from '../components/common/decor/HandNote'
import StatusMessage from '../components/common/StatusMessage'
import BakeryCardSkeleton from '../components/common/BakeryCardSkeleton'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS, REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { FILTER_CHIP_SX } from '../constants/chipStyles'
import { getAuthorLevel } from '../utils/authorLevel'
import { useBusanBakeries } from '../hooks/useBusanBakeries'

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
  // 지도에서 고른 빵집: 오늘 인기 빵집 캐러셀에도 선택 표시를 해요
  const [mapSelectedId, setMapSelectedId] = useState(null)
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
      {/* 첫 화면: 부산 빵집 지도 */}
      <BakeryMapHero
        bakeries={realBakeries}
        selectedId={mapSelectedId}
        onSelectBakery={setMapSelectedId}
        loading={bakeriesLoading}
        error={bakeriesError}
        onRetry={reloadBakeries}
      />

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
            <PopularBakeryCarousel bakeries={carouselBakeries} highlightedId={mapSelectedId} />
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

      {/* 레벨업 안내 (작은 띠) */}
      <LevelUpTeaser />

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

      {/* 이름 · 메뉴 검색: 와인 색 블록 (위치로 찾기는 맨 위 지도 Hero에서) */}
      <Box sx={{ ...FULL_BLEED_SX }}>
        <Box sx={{ position: 'relative', bgcolor: 'primary.main', pt: SECTION_PY, pb: { xs: 5, md: 6 }, overflow: 'hidden' }}>
          <FlatFlower petal={palette.mustard.main} center={palette.primary.main} size={60} sx={{ position: 'absolute', top: 28, right: { xs: -16, md: 120, lg: '3%' } }} />
          <FlatFlower petal={palette.background.paper} center={palette.terracotta.main} size={40} sx={{ position: 'absolute', bottom: 24, left: { xs: 12, md: 110 }, opacity: 0.9 }} />
          {/* 검색창 양옆 여백의 장식: 왼쪽 빵 바구니, 오른쪽 손글씨 + 딸기 케이크. 여백이 넉넉한 넓은 화면에서만 보여요. */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <Illustration
              name="breadBasket"
              width={180}
              sx={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%) rotate(-4deg)' }}
            />
            <HandNote color="mustard.main" rotate={-8} sx={{ position: 'absolute', right: '12%', top: 52 }}>
              맛있는 빵집을
              <br />
              더 쉽게 찾아보세요!
            </HandNote>
            <Illustration
              name="strawberryCake"
              width={104}
              sx={{ position: 'absolute', right: '6%', bottom: 40, transform: 'rotate(6deg)' }}
            />
          </Box>
          <Container maxWidth="sm" sx={{ position: 'relative' }}>
            <SectionHeading
              eyebrow="SEARCH BY NAME"
              title="찾고 싶은 빵집이 있나요?"
              description="빵집 이름이나 먹고 싶은 메뉴로 찾아보세요."
              tone="onColor"
              sx={{ mb: 3 }}
            />
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="빵집 이름이나 메뉴를 검색해 보세요"
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
