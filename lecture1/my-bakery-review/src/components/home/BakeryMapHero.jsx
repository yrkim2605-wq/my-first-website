import { useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import BakeryMap from './BakeryMap'
import WavyDivider from '../common/decor/WavyDivider'
import { MAP_REGIONS, DEFAULT_MAP_REGION_ID } from '../../constants/mapRegions'
import { RADIUS } from '../../theme'

// 홈 첫 화면: 부산 빵집을 지도에서 찾아보는 Hero 섹션
const BakeryMapHero = ({ bakeries, loading, error, onRetry }) => {
  // 같은 지역 버튼을 다시 눌러도 지도가 돌아가도록, 누를 때마다 n을 올려요
  const [regionRequest, setRegionRequest] = useState({ id: DEFAULT_MAP_REGION_ID, n: 0 })

  return (
    <Box component="section" aria-labelledby="map-hero-title" sx={{ bgcolor: 'background.default', pt: { xs: 5, md: 6 }, pb: { xs: 5, md: 7 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 3, md: 3.5 } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', color: 'terracotta.main', mb: 1 }}>
            FIND YOUR BAKERY
          </Typography>
          <Typography
            id="map-hero-title"
            variant="h1"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.6rem' }, color: 'primary.main', wordBreak: 'keep-all' }}
          >
            오늘은 어디로 빵지순례 갈까?
          </Typography>
          <WavyDivider sx={{ my: 1.5 }} />
          <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, color: 'text.secondary', wordBreak: 'keep-all' }}>
            부산 곳곳의 숨은 빵집을 지도에서 발견해 보세요.
          </Typography>
        </Box>

        {/* 지역 버튼: 누르면 지도가 그 지역으로 이동해요. 모바일에서 넘치면 가로로 스크롤돼요. */}
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
            pb: 0.5,
            mb: 2,
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
                  px: 2,
                  py: 0.9,
                  borderRadius: RADIUS.pill,
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'rgba(59,42,34,0.18)',
                  bgcolor: selected ? 'primary.main' : 'background.paper',
                  color: selected ? '#FFFFFF' : 'text.primary',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                  '&:hover': selected ? {} : { borderColor: 'primary.main', color: 'primary.main' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                }}
              >
                {region.label}
              </Box>
            )
          })}
        </Box>

        <BakeryMap bakeries={bakeries} regionRequest={regionRequest} loading={loading} error={error} onRetry={onRetry} />
      </Container>
    </Box>
  )
}

export default BakeryMapHero
