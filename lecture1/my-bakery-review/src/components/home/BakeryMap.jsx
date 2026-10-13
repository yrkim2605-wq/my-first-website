import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import GlobalStyles from '@mui/material/GlobalStyles'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined'
import { loadKakaoSdk } from '../../api/kakaoLocal'
import { MAP_REGIONS, DEFAULT_MAP_REGION_ID } from '../../constants/mapRegions'
import BakeryMapInfoCard from './BakeryMapInfoCard'
import { RADIUS } from '../../theme'

// 터치 화면에서는 처음에 지도를 잠가 두고, 탭해서 풀어야 끌 수 있어요 (페이지 스크롤과 부딪히지 않게)
const IS_TOUCH = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches)

// 이 확대 수준 이상(멀리서 볼 때)에서는 가까운 마커를 묶어서 숫자로 보여줘요
const CLUSTER_MIN_LEVEL = 6

// 마커 안의 식빵 아이콘
const TOAST_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6.5 20V11.6A4.3 4.3 0 0 1 8.3 3.5h7.4a4.3 4.3 0 0 1 1.8 8.1V20z" fill="currentColor"/></svg>'

const ZOOM_BUTTON_SX = {
  width: 36,
  height: 36,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  bgcolor: 'background.paper',
  color: 'text.primary',
  cursor: 'pointer',
  '&:hover': { color: 'primary.main' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
}

const getRegion = (id) => MAP_REGIONS.find((r) => r.id === id) ?? MAP_REGIONS[0]

const BakeryMap = ({ bakeries, regionRequest, loading, error, onRetry }) => {
  const { palette } = useTheme()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const kakaoRef = useRef(null)
  const clustererRef = useRef(null)
  const markersRef = useRef(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [sdkError, setSdkError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [touchUnlocked, setTouchUnlocked] = useState(!IS_TOUCH)

  // 1) 지도와 클러스터러를 한 번만 만들어요
  useEffect(() => {
    let cancelled = false
    loadKakaoSdk()
      .then((kakao) => {
        if (cancelled || mapRef.current || !containerRef.current) return
        const start = getRegion(DEFAULT_MAP_REGION_ID)
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(start.lat, start.lng),
          level: start.level,
        })
        // 마우스 휠은 페이지 스크롤에 쓰고, 확대 · 축소는 +/− 버튼으로 해요
        map.setZoomable(false)
        if (IS_TOUCH) map.setDraggable(false)
        kakao.maps.event.addListener(map, 'click', () => setSelectedId(null))

        const clusterStyle = (size) => ({
          width: `${size}px`,
          height: `${size}px`,
          lineHeight: `${size - 6}px`,
          borderRadius: '50%',
          background: palette.primary.main,
          border: `3px solid ${palette.background.paper}`,
          boxShadow: '0 4px 12px rgba(59,42,34,0.25)',
          color: palette.primary.contrastText,
          textAlign: 'center',
          fontWeight: '700',
          fontSize: '14px',
        })
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: CLUSTER_MIN_LEVEL,
          gridSize: 64,
          calculator: [10, 30],
          styles: [clusterStyle(40), clusterStyle(48), clusterStyle(56)],
        })
        kakaoRef.current = kakao
        mapRef.current = map
        setMapReady(true)
      })
      .catch((err) => {
        if (!cancelled) setSdkError(err)
      })
    return () => {
      cancelled = true
    }
  }, [palette])

  // 2) 빵집 데이터가 바뀌면 마커를 다시 올려요 (위도 · 경도가 있는 실제 빵집만)
  useEffect(() => {
    if (!mapReady) return undefined
    const kakao = kakaoRef.current
    const clusterer = clustererRef.current
    const overlays = []
    const byId = new Map()

    bakeries
      .filter((bakery) => Number.isFinite(bakery.lat) && Number.isFinite(bakery.lng))
      .forEach((bakery) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'bakery-marker'
        el.setAttribute('aria-label', `${bakery.name} 정보 보기`)
        el.innerHTML = `<span class="bakery-marker__badge">${TOAST_ICON}</span>`
        el.addEventListener('click', (event) => {
          event.stopPropagation()
          setSelectedId(bakery.id)
        })
        // yAnchor 1: 마커 꼬리 끝이 빵집의 실제 좌표를 가리켜요
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(bakery.lat, bakery.lng),
          content: el,
          xAnchor: 0.5,
          yAnchor: 1,
          clickable: true,
        })
        overlays.push(overlay)
        byId.set(bakery.id, { overlay, el })
      })

    clusterer.addMarkers(overlays)
    markersRef.current = byId
    return () => {
      clusterer.removeMarkers(overlays)
      markersRef.current = new Map()
    }
  }, [mapReady, bakeries])

  // 3) 선택한 마커만 강조해요
  useEffect(() => {
    markersRef.current.forEach(({ overlay, el }, id) => {
      const isSelected = id === selectedId
      el.classList.toggle('is-selected', isSelected)
      overlay.setZIndex(isSelected ? 10 : 1)
    })
  }, [selectedId, mapReady, bakeries])

  // 4) 지역 버튼을 누르면 그 지역으로 부드럽게 이동해요
  // 확대와 이동을 동시에 하면 카카오맵이 이동을 무시해서, 먼저 이동하고 이동이 끝나면 확대해요.
  useEffect(() => {
    if (!mapReady) return undefined
    const kakao = kakaoRef.current
    const map = mapRef.current
    const region = getRegion(regionRequest.id)
    const zoomAfterMove = () => {
      kakao.maps.event.removeListener(map, 'idle', zoomAfterMove)
      if (map.getLevel() !== region.level) map.setLevel(region.level, { animate: { duration: 300 } })
    }
    kakao.maps.event.addListener(map, 'idle', zoomAfterMove)
    map.panTo(new kakao.maps.LatLng(region.lat, region.lng))
    return () => kakao.maps.event.removeListener(map, 'idle', zoomAfterMove)
  }, [regionRequest, mapReady])

  // 5) 지도 상자 크기가 바뀌면(화면 회전 · 창 크기 변경) 지도를 다시 맞춰요
  useEffect(() => {
    if (!mapReady || !containerRef.current) return undefined
    const observer = new ResizeObserver(() => mapRef.current?.relayout())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [mapReady])

  const handleZoom = (delta) => {
    const map = mapRef.current
    if (!map) return
    map.setLevel(map.getLevel() + delta, { animate: { duration: 250 } })
  }

  const handleUnlockTouch = () => {
    mapRef.current?.setDraggable(true)
    mapRef.current?.setZoomable(true)
    setTouchUnlocked(true)
  }

  const selectedBakery = bakeries.find((b) => b.id === selectedId)
  const showError = Boolean(error || sdkError)

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 340, sm: 400, md: 420 },
        borderRadius: { xs: RADIUS.lg, md: '24px' },
        overflow: 'hidden',
        border: '1px solid rgba(59,42,34,0.12)',
        bgcolor: 'butter.main',
      }}
    >
      <GlobalStyles
        styles={{
          '.bakery-marker': {
            position: 'relative',
            display: 'block',
            width: 34,
            height: 42,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          },
          '.bakery-marker__badge': {
            position: 'absolute',
            left: 0,
            top: 0,
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            background: palette.primary.main,
            color: palette.primary.contrastText,
            border: `2px solid ${palette.background.paper}`,
            boxShadow: '0 3px 8px rgba(59,42,34,0.3)',
            transformOrigin: '50% 120%',
            transition: 'transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
          },
          // 배지 아래 꼬리: 이 끝이 실제 위치예요
          '.bakery-marker__badge::after': {
            content: '""',
            position: 'absolute',
            left: '50%',
            bottom: -9,
            transform: 'translateX(-50%)',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `9px solid ${palette.primary.main}`,
          },
          '.bakery-marker:hover .bakery-marker__badge, .bakery-marker:focus-visible .bakery-marker__badge': {
            transform: 'scale(1.12)',
          },
          '.bakery-marker:focus-visible': { outline: 'none' },
          '.bakery-marker.is-selected .bakery-marker__badge': {
            transform: 'scale(1.25)',
            borderColor: palette.mustard.main,
            background: palette.primary.dark,
          },
          '.bakery-marker.is-selected .bakery-marker__badge::after': {
            borderTopColor: palette.primary.dark,
          },
        }}
      />

      <Box ref={containerRef} sx={{ position: 'absolute', inset: 0 }} aria-label="부산 빵집 지도" role="region" />

      {/* 확대 · 축소 버튼 */}
      {mapReady && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 5,
            top: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: RADIUS.md,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(59,42,34,0.15)',
            '& > button + button': { borderTop: '1px solid rgba(59,42,34,0.1)' },
          }}
        >
          <Box component="button" type="button" aria-label="지도 확대" onClick={() => handleZoom(-1)} sx={ZOOM_BUTTON_SX}>
            <AddIcon fontSize="small" />
          </Box>
          <Box component="button" type="button" aria-label="지도 축소" onClick={() => handleZoom(1)} sx={ZOOM_BUTTON_SX}>
            <RemoveIcon fontSize="small" />
          </Box>
        </Box>
      )}

      {/* 불러오는 중 */}
      {loading && !showError && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 5,
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 2,
            py: 0.75,
            borderRadius: RADIUS.pill,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 12px rgba(59,42,34,0.15)',
            fontSize: '0.85rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          부산 빵집을 지도에 올리는 중이에요…
        </Box>
      )}

      {/* 오류 */}
      {showError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 6,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(246,238,220,0.85)',
            textAlign: 'center',
            px: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>지도를 불러오지 못했어요</Typography>
            {onRetry && (
              <Button variant="contained" onClick={onRetry} sx={{ borderRadius: RADIUS.pill }}>
                다시 시도
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* 터치 화면: 탭해야 지도를 움직일 수 있어요 */}
      {mapReady && !touchUnlocked && !showError && (
        <Box
          component="button"
          type="button"
          onClick={handleUnlockTouch}
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            border: 'none',
            bgcolor: 'rgba(59,42,34,0.08)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2,
              py: 1,
              borderRadius: RADIUS.pill,
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(59,42,34,0.18)',
            }}
          >
            <TouchAppOutlinedIcon fontSize="small" />
            탭해서 지도 움직이기
          </Box>
        </Box>
      )}

      {selectedBakery && <BakeryMapInfoCard bakery={selectedBakery} onClose={() => setSelectedId(null)} />}
    </Box>
  )
}

export default BakeryMap
