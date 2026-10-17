import { useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import BakeryMap from './BakeryMap'
import Sticker from '../common/decor/Sticker'
import SectionHeading from '../common/SectionHeading'
import { MAP_REGIONS, DEFAULT_MAP_REGION_ID } from '../../constants/mapRegions'
import { WORLD_MAP_SECTION_ID } from '../../constants/sectionIds'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'

// 빵지순례 월드맵: 부산 빵집을 카카오맵에서 찾아보는 영역이에요.
// 지도 기능은 그대로고, 바깥만 모험 지도처럼 꾸몄어요 (양피지 프레임 + 지역 선택 탭).
// 장식(PC lg 이상만): 레퍼런스처럼 왼쪽 아래 · 오른쪽 아래 모서리 덩어리와 오른쪽 위 빵 기사만 두었어요 (폰 · 태블릿에서는 숨겨요).
const DECOR_LG = { position: 'absolute', zIndex: 0, display: { xs: 'none', lg: 'block' } }
const FRONT = { zIndex: 2 }
// 모서리 덩어리 아래 모래색 흙: 가장자리가 부드럽게 사라지는 얇은 타원
const SAND_SX = {
  display: { xs: 'none', lg: 'block' },
  position: 'absolute',
  zIndex: 0,
  bottom: -22,
  height: 46,
  pointerEvents: 'none',
  backgroundColor: 'rgba(224,186,122,0.85)',
  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 50%, transparent 72%)',
  maskImage: 'radial-gradient(ellipse at 50% 50%, #000 50%, transparent 72%)',
}

// 나무 프레임: 얇고 밝은 나무색 바탕 + 세로 나뭇결 + 갈색 바깥 테두리 + 안쪽 밝은 단(입체감)
const WOOD_FRAME_SX = {
  backgroundColor: '#c08a4e',
  backgroundImage:
    'repeating-linear-gradient(90deg, rgba(60,32,12,0.10) 0 2px, transparent 2px 14px), linear-gradient(180deg, rgba(255,226,170,0.28), rgba(255,226,170,0) 40%, rgba(60,32,12,0.14))',
  border: '3px solid #5a3a1c',
  boxShadow: 'inset 0 0 0 2px #dba96a, inset 0 0 0 4px #7a4f26, 0 3px 0 rgba(33,20,10,0.35), 0 10px 20px rgba(51,36,25,0.16)',
}
const BakeryMapHero = ({ bakeries, selectedId, onSelectBakery, loading, error, onRetry }) => {
  // 같은 지역 버튼을 다시 눌러도 지도가 돌아가도록, 누를 때마다 n을 올려요
  const [regionRequest, setRegionRequest] = useState({ id: DEFAULT_MAP_REGION_ID, n: 0 })

  return (
    <Box
      component="section"
      id={WORLD_MAP_SECTION_ID}
      aria-labelledby="map-hero-title"
      // lg 이상은 프레임 아래로 덤불이 내다볼 자리(pb)를 조금 더 둬요. overflowX: clip은 장식이 칸 밖으로 나가도 가로 스크롤을 만들지 않게 하는 안전장치예요.
      sx={{ bgcolor: 'background.default', pt: { xs: 5, md: 7 }, pb: { xs: 4, lg: 9 }, overflowX: 'clip' }}
    >
      <Container maxWidth="lg">
        <SectionHeading
          variant="ribbon"
          size="lg"
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
                  '@media (pointer: coarse)': { minHeight: 44 },
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

      {/* 지도는 제목 · 탭보다 넓게 (최대 1560px), 화면이 좁으면 화면 폭에 맞춰요. 나무 프레임 안에 담아요.
          PC(lg 이상)에서는 프레임 양옆에 160px씩 여백을 두고, 그 여백과 프레임 모서리 위에 장식을 놓아요 (레퍼런스: 왼쪽 아래 빵 표지판 · 오른쪽 아래 꽃 덤불 · 오른쪽 위 빵 기사).
          장식 위치는 모두 이 바깥 칸(wrapper) 기준이에요. 지도 안쪽의 지역 카드 · 줌 버튼 · 카카오 로고(왼쪽 아래)는 가리지 않도록 모서리 덩어리가 프레임 안으로 들어오는 길이를 맞췄어요. */}
      <Box sx={{ position: 'relative', maxWidth: 1560, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* 바닥: 모서리 덩어리 아래에만 모래색 흙이 얇게 깔려요 */}
        <Box aria-hidden="true" sx={{ ...SAND_SX, left: 6, width: 280 }} />
        <Box aria-hidden="true" sx={{ ...SAND_SX, right: -10, width: 280 }} />

        {/* 오른쪽 위: 프레임 위로 빼꼼 내다보는 빵 기사 */}
        {/* 빵 기사 양옆에 작은 잔디: 프레임 윗선 위로 풀잎만 솟아 보이게 프레임 뒤에 세워요 */}
        <Sticker name="grove-tuft-a" width={50} sx={{ ...DECOR_LG, right: 346, top: -22 }} />
        <Sticker name="grove-tuft-c" width={70} sx={{ ...DECOR_LG, right: 228, top: -30, transform: 'scaleX(-1)' }} />
        <Sticker name="grove-tuft-a" width={46} sx={{ ...DECOR_LG, right: 196, top: -20, transform: 'scaleX(-1)' }} />
        <Sticker name="knight-peek" width={150} sx={{ ...DECOR_LG, right: 227, top: -73 }} />

        {/* 왼쪽 아래: 빵 표지판 + 꽃 덤불 + 돌 */}
        {/* 표지판 덤불 위로 바람에 날리는 나뭇잎 3장: 움직이지 않고, 대각선으로 흩어진 위치와 서로 다른 기울기로 "날리는 느낌"만 내요 */}
        <Sticker name="leaf-fly-a" width={46} sx={{ ...DECOR_LG, left: 98, bottom: 214, transform: 'rotate(28deg)' }} />
        <Sticker name="leaf-fly-b" width={32} sx={{ ...DECOR_LG, left: 58, bottom: 180, transform: 'rotate(-34deg)' }} />
        <Sticker name="leaf-fly-c" width={30} sx={{ ...DECOR_LG, left: 128, bottom: 172, transform: 'rotate(62deg)' }} />
        <Sticker name="grove-sign" width={186} sx={{ ...DECOR_LG, ...FRONT, left: 16, bottom: -4 }} />
        <Sticker name="grove-pebble" width={92} sx={{ ...DECOR_LG, ...FRONT, left: 72, bottom: -10 }} />

        {/* 오른쪽 아래: 꽃 덤불 + 돌, 위로 날리는 나뭇잎 1장 (가만히 있는 배치) */}
        <Sticker name="leaf-fly-a" width={42} sx={{ ...DECOR_LG, right: 118, bottom: 156, transform: 'rotate(-30deg) scaleX(-1)' }} />
        <Sticker name="grove-leaf" width={210} sx={{ ...DECOR_LG, ...FRONT, right: 2, bottom: -4 }} />
        <Sticker name="grove-pebble" width={112} sx={{ ...DECOR_LG, ...FRONT, right: 60, bottom: -10, transform: 'scaleX(-1)' }} />

        {/* 나무 프레임 */}
        <Box sx={{ ...WOOD_FRAME_SX, position: 'relative', zIndex: 1, mx: { lg: '160px' }, p: { xs: 1, sm: 1.25 }, borderRadius: { xs: '18px', md: '22px' } }}>
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
