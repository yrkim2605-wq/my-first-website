import { useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import BakeryMap from './BakeryMap'
import SectionHeading from '../common/SectionHeading'
import { MAP_REGIONS, DEFAULT_MAP_REGION_ID } from '../../constants/mapRegions'
import { WORLD_MAP_SECTION_ID } from '../../constants/sectionIds'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'

// 빵지순례 월드맵: 부산 빵집을 카카오맵에서 찾아보는 영역이에요.
// 지도 기능은 그대로고, 바깥만 모험 지도처럼 꾸몄어요 (양피지 프레임 + 지역 선택 탭).
const BakeryMapHero = ({ bakeries, selectedId, onSelectBakery, loading, error, onRetry }) => {
  // 같은 지역 버튼을 다시 눌러도 지도가 돌아가도록, 누를 때마다 n을 올려요
  const [regionRequest, setRegionRequest] = useState({ id: DEFAULT_MAP_REGION_ID, n: 0 })

  return (
    <Box
      component="section"
      id={WORLD_MAP_SECTION_ID}
      aria-labelledby="map-hero-title"
      sx={{ bgcolor: 'background.default', pt: { xs: 5, md: 7 }, pb: { xs: 2, md: 2 } }}
    >
      <Container maxWidth="lg">
        <SectionHeading
          variant="sign"
          eyebrow="WORLD MAP"
          title="빵지순례 월드맵"
          titleId="map-hero-title"
          description="아직 발견하지 못한 빵집이 기다리고 있어!"
          sx={{ mb: 3 }}
        />

        {/* 지역 선택 탭: 누르면 지도가 그 지역으로 이동해요. 모바일에서 넘치면 가로로 스크롤돼요. */}
        <Box
          role="group"
          aria-label="지역으로 지도 이동"
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'center' },
            gap: 1,
            overflowX: 'auto',
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            pt: 0.5,
            pb: 1,
            mb: 1,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {MAP_REGIONS.map((region) => {
            const selected = region.id === regionRequest.id
            return (
              <Box
                key={region.id}
                component="button"
                type="button"
                aria-pressed={selected}
                onClick={() => setRegionRequest((prev) => ({ id: region.id, n: prev.n + 1 }))}
                sx={{
                  flexShrink: 0,
                  px: 2.25,
                  py: 0.9,
                  borderRadius: '12px',
                  // 선택한 지역은 어두운 나무 팻말, 나머지는 양피지 팻말
                  ...(selected
                    ? { ...WOOD_PLANK_SX, color: 'gold.light', transform: 'translateY(-2px)' }
                    : { ...PARCHMENT_SX, boxShadow: '0 2px 0 rgba(107,68,35,0.22)' }),
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
                  '&:hover': { transform: 'translateY(-2px)', filter: selected ? 'brightness(1.06)' : 'brightness(0.97)' },
                  '&:active': { transform: 'translateY(1px)' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                }}
              >
                {region.label}
              </Box>
            )
          })}
        </Box>
      </Container>

      {/* 지도는 제목 · 탭보다 넓게 (최대 1320px), 화면이 좁으면 화면 폭에 맞춰요. 양피지 프레임 안에 담아요. */}
      <Box sx={{ maxWidth: 1320 + 48, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ ...PARCHMENT_SX, p: { xs: 1, sm: 1.5 }, borderRadius: { xs: '18px', md: '26px' } }}>
          <BakeryMap
            bakeries={bakeries}
            regionRequest={regionRequest}
            selectedId={selectedId}
            onSelectBakery={onSelectBakery}
            loading={loading}
            error={error}
            onRetry={onRetry}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default BakeryMapHero
