import { useCallback, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import BakeryStageCard from '../components/common/BakeryStageCard'
import PopularBakeryCarousel from '../components/common/PopularBakeryCarousel'
import PopularReviewCarousel from '../components/common/PopularReviewCarousel'
import SectionHeading from '../components/common/SectionHeading'
import AdventureHero from '../components/home/AdventureHero'
import BakeryMapHero from '../components/home/BakeryMapHero'
import BakerySearchBar from '../components/home/BakerySearchBar'
import LevelUpTeaser from '../components/home/LevelUpTeaser'
import ScallopEdge from '../components/common/decor/ScallopEdge'
import Sticker from '../components/common/decor/Sticker'
import StatusMessage from '../components/common/StatusMessage'
import BakeryCardSkeleton from '../components/common/BakeryCardSkeleton'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS, REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { ALL_BAKERIES_SECTION_ID } from '../constants/sectionIds'
import { getAuthorLevel } from '../utils/authorLevel'
import { useBusanBakeries } from '../hooks/useBusanBakeries'
import { useGameState } from '../hooks/useGameState'
import { useBakeryRatings } from '../hooks/useBakeryRatings'

// "전체 빵집"은 처음에 이만큼만 보여주고, "빵집 더 보기"로 같은 수만큼 이어서 보여줘요.
const BAKERY_PAGE_SIZE = 12

// 화면 전체 폭 박스. 부모(홈의 각 섹션)가 이미 화면 전체 폭이라 100%면 돼요.
// (예전의 100vw + 좌우 당기기 방식은, 세로 스크롤바가 있는 화면에서 스크롤바 폭만큼 가로로 넘쳤어요)
const FULL_BLEED_SX = {
  width: '100%',
}

const SECTION_PY = { xs: 6, md: 9 }

// 추천 퀘스트 뒤에 깔리는 옅은 양피지 띠: 위아래가 서서히 사라져서 월드맵 · 모험가 길드와 경계가 부드럽게 이어져요
const QUEST_BAND_BG =
  'linear-gradient(180deg, rgba(249,237,203,0) 0%, rgba(249,237,203,0.6) 22%, rgba(249,237,203,0.6) 78%, rgba(249,237,203,0) 100%)'
const SECTION_PX = { xs: 3, sm: 6, md: 6, lg: 8 }

const POPULAR_REVIEWS = [...BAKERY_REVIEWS]
  .sort((a, b) => b.heartCount - a.heartCount)
  .slice(0, 8)
  .map((review) => ({
    ...review,
    bakery: BAKERIES.find((b) => b.id === review.bakeryId),
    avatarImage: getAuthorLevel(review.author).iconImage,
    avatarScale: getAuthorLevel(review.author).iconScale,
    levelName: getAuthorLevel(review.author).name,
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

  // 내가 모험 일지를 남긴 빵집 = 발견 완료 (카드에 도장이 찍혀요)
  const { stats: myStats } = useGameState()
  const discoveredIds = myStats.discoveredBakeryIds

  // 빵집 카드의 평균 별점 · 리뷰 개수: 계정 모드는 서버 집계, 로컬 모드는 예전 방식(예시 데이터 표) 그대로예요
  const { isEnabled: ratingsEnabled, getRating } = useBakeryRatings()
  const ratingProps = useCallback(
    (bakery) => {
      if (!ratingsEnabled) return { reviewCount: REVIEW_COUNT_BY_BAKERY_ID[bakery.id] || 0 }
      const info = getRating(bakery.id)
      return { rating: info.average, reviewCount: info.count, ratingStatus: info.status }
    },
    [ratingsEnabled, getRating],
  )

  const { palette } = theme
  const sageColor = palette.secondary.main

  const selectedDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isFiltering = Boolean(normalizedQuery) || Boolean(selectedDistrictId)

  const popularBakeries = useMemo(() => realBakeries.slice(0, 5), [realBakeries])
  // 최근에 등록된 5곳: 카드에 NEW 표시만 해요 (홈의 "새롭게 발견된 빵집" 섹션은 없앴어요)
  const newBakeries = useMemo(() => [...realBakeries].reverse().slice(0, 5), [realBakeries])
  const newBakeryIds = useMemo(() => new Set(newBakeries.map((b) => b.id)), [newBakeries])

  const carouselBakeries = useMemo(
    () =>
      popularBakeries.map((bakery) => ({
        ...bakery,
        districtLabel: DISTRICTS.find((d) => d.id === bakery.districtId)?.name,
        ...ratingProps(bakery),
        isNew: newBakeryIds.has(bakery.id),
        discovered: discoveredIds.has(String(bakery.id)),
      })),
    [popularBakeries, newBakeryIds, discoveredIds, ratingProps],
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

  // 히어로 아래 검색창과 결과 자리 재검색창이 같은 상태 · 같은 함수를 쓰도록 한 곳에서 묶어요 (검색 로직은 위의 하나뿐이에요)
  const searchBarProps = {
    searchQuery,
    onSearchChange: handleSearchChange,
    selectedDistrictId,
    onSelectDistrict: handleSelectDistrict,
    resultCount: bakeriesLoading || bakeriesError ? null : filteredBakeries.length,
    onReset: handleResetFilters,
  }

  const bakeriesErrorMessage = (
    <StatusMessage
      mood="error"
      title="빵집 정보를 불러오지 못했어요"
      description="잠시 후 다시 시도해주세요."
      actionLabel="다시 시도"
      onAction={reloadBakeries}
    />
  )

  return (
    <>
      {/* 첫 화면: 모험 시작 (타이틀 + 빵 기사) */}
      <AdventureHero />

      {/* 빵집 찾기: 이름 · 메뉴 검색 + 지역 필터 (결과는 아래 "전체 빵집"에 나와요) */}
      <BakerySearchBar {...searchBarProps} />

      {/* 빵지순례 월드맵: 부산 빵집 지도 */}
      <BakeryMapHero
        bakeries={realBakeries}
        selectedId={mapSelectedId}
        onSelectBakery={setMapSelectedId}
        loading={bakeriesLoading}
        error={bakeriesError}
        onRetry={reloadBakeries}
      />

      {/* 오늘 인기 빵집 */}
      <Box sx={{ pt: SECTION_PY, pb: { xs: 5, md: 7 }, background: QUEST_BAND_BG }}>
        <SectionHeading
          variant="board"
          eyebrow="TODAY'S QUEST"
          title="오늘의 추천 퀘스트"
          description="마음에 드는 퀘스트를 골라 빵집 탐험을 떠나보세요."
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

      {/* 모험가 길드: 레벨 · EXP 안내 (리뷰보다 먼저: 성장 시스템을 먼저 알려요) */}
      <LevelUpTeaser />

      {/* 이번 주 인기 리뷰: 세이지 색 블록 */}
      <Box sx={{ ...FULL_BLEED_SX }}>
        <ScallopEdge color={sageColor} position="top" />
        <Box sx={{ position: 'relative', bgcolor: 'secondary.main', py: SECTION_PY, overflow: 'hidden' }}>
          <Sticker name="grove-flower-white" width={72} sx={{ position: 'absolute', top: 36, left: { xs: -18, md: 64 } }} />
          <Sticker name="grove-flower-red" width={46} sx={{ position: 'absolute', top: 118, left: { xs: 40, md: 150 }, display: { xs: 'none', md: 'block' } }} />
          <Sticker name="grove-flower-yellow" width={58} sx={{ position: 'absolute', top: 44, right: { xs: -12, md: 90 } }} />
          <SectionHeading
            variant="journal"
            eyebrow="ADVENTURER'S LOG"
            title="모험가의 기록"
            description="한 줄의 기록이 누군가의 다음 모험이 돼요."
            tone="onSage"
            sx={{ mb: { xs: 4, md: 5 }, px: 2, position: 'relative' }}
          />
          <Box sx={{ px: SECTION_PX, position: 'relative' }}>
            <PopularReviewCarousel reviews={POPULAR_REVIEWS} />
          </Box>
        </Box>
        <ScallopEdge color={sageColor} position="bottom" />
      </Box>

      {/* 전체 빵집 */}
      <Container maxWidth="xl" component="section" id={ALL_BAKERIES_SECTION_ID} aria-labelledby="all-bakeries-title">
        <Box sx={{ pt: { xs: 5, md: 7 }, pb: SECTION_PY }}>
          {/* 검색어 · 지역은 위쪽 "빵집 찾기" 바에서 골라요. 여기서는 결과 제목과 개수만 보여줘요. */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography id="all-bakeries-title" variant="h2" sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '1.8rem' } }}>
                {normalizedQuery ? `“${searchQuery.trim()}” 검색 결과` : selectedDistrict ? `${selectedDistrict.name} 빵집` : '전체 빵집'}
              </Typography>
              {!bakeriesLoading && !bakeriesError && (
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 0.5 }}>
                  {normalizedQuery && selectedDistrict ? `${selectedDistrict.name} · ` : ''}
                  {filteredBakeries.length}곳
                </Typography>
              )}
            </Box>
            {isFiltering && (
              <Button size="small" onClick={handleResetFilters} sx={{ fontWeight: 700, flexShrink: 0 }}>
                필터 초기화
              </Button>
            )}
          </Box>

          {/* 재검색용 검색창 · 지역 필터: 위쪽 검색창과 같은 상태라서 어느 쪽에서 바꿔도 결과가 같이 바뀌어요. 결과가 0개여도 항상 보여요. */}
          <BakerySearchBar {...searchBarProps} variant="results" />

          {bakeriesError && bakeriesErrorMessage}
          {!bakeriesLoading && !bakeriesError && filteredBakeries.length === 0 && (
            <StatusMessage
              mood="empty"
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
              gap: { xs: 1.5, sm: 3 }, // 폰의 가로형 컴팩트 카드는 간격을 좁혀요
            }}
          >
            {bakeriesLoading &&
              Array.from({ length: 8 }, (_, i) => <BakeryCardSkeleton key={i} compactMobile />)}
            {!bakeriesLoading &&
              !bakeriesError &&
              visibleBakeries.map((bakery) => (
                <BakeryStageCard
                  key={bakery.id}
                  {...bakery}
                  districtLabel={DISTRICTS.find((d) => d.id === bakery.districtId)?.name}
                  {...ratingProps(bakery)}
                  isNew={newBakeryIds.has(bakery.id)}
                  discovered={discoveredIds.has(String(bakery.id))}
                  compactMobile
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
