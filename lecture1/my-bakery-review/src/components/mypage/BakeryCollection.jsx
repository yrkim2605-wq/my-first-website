import { useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import XpTrack from '../common/XpTrack'
import defaultBakeryIcon from '../../assets/section-icons/icon-default-bakery.webp'
import StatusMessage from '../common/StatusMessage'
import { DISTRICTS } from '../../constants/districts'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

const PAGE_SIZE = 24

const BakeryTile = ({ bakery, discovered }) => (
  <Box
    component={Link}
    to={`/bakery/${bakery.id}`}
    aria-label={`${bakery.name} ${discovered ? '(발견 완료)' : '(미발견)'}`}
    sx={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      height: '100%',
      px: 1,
      py: 1.5,
      textAlign: 'center',
      textDecoration: 'none',
      color: 'inherit',
      borderRadius: RADIUS.lg,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ...(discovered
        ? { ...PARCHMENT_SX, borderColor: 'gold.main' }
        : { border: '2px dashed', borderColor: 'rgba(201,165,106,0.8)', bgcolor: 'rgba(255,255,255,0.35)' }),
      '@media (hover: hover)': { '&:hover': { transform: 'translateY(-3px)' } },
      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
    }}
  >
    {discovered ? (
      <StarRoundedIcon sx={{ position: 'absolute', top: 6, right: 6, fontSize: '1.15rem', color: 'gold.main' }} />
    ) : (
      <Box component="span" sx={{ position: 'absolute', top: 6, right: 8, fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
        미발견
      </Box>
    )}
    <Box
      component="img"
      src={bakery.iconImage}
      alt=""
      loading="lazy"
      sx={{ width: 52, height: 52, objectFit: 'contain', filter: discovered ? 'none' : 'grayscale(1)', opacity: discovered ? 1 : 0.5 }}
    />
    <Typography
      sx={{
        fontSize: '0.78rem',
        fontWeight: 700,
        lineHeight: 1.35,
        color: discovered ? 'text.primary' : 'text.secondary',
        wordBreak: 'keep-all',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {bakery.name}
    </Typography>
  </Box>
)

// 빵집 도감: 카카오 빵집 전체를 칸으로 보여주고, 내가 일지를 남긴 빵집은 "발견 완료"로 밝아져요.
// discovery: useDiscovery()의 결과
const BakeryCollection = ({ discovery }) => {
  const [districtId, setDistrictId] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const { bakeries, loading, error, reload, isDiscovered, discoveredInListCount, totalCount, extraDiscovered } = discovery

  const inDistrict = (bakery) => districtId === 'all' || bakery.districtId === districtId
  // 발견한 빵집을 앞에 보여줘요
  const entries = [
    ...extraDiscovered.filter(inDistrict).map((bakery) => ({ bakery: { ...bakery, iconImage: defaultBakeryIcon }, discovered: true })),
    ...bakeries.filter(inDistrict).map((bakery) => ({ bakery, discovered: isDiscovered(bakery.id) })),
  ].sort((a, b) => Number(b.discovered) - Number(a.discovered))
  const shown = entries.slice(0, visibleCount)

  // 지역 칩에 "발견/전체"를 보여줘요 (칸으로 보이는 빵집 기준이라 발견이 늘면 전체도 함께 늘어요)
  const countsByDistrict = {}
  ;[...extraDiscovered.map((bakery) => ({ bakery, discovered: true })), ...bakeries.map((bakery) => ({ bakery, discovered: isDiscovered(bakery.id) }))].forEach(
    ({ bakery, discovered }) => {
      const counts = (countsByDistrict[bakery.districtId] ??= { found: 0, total: 0 })
      counts.total += 1
      if (discovered) counts.found += 1
    },
  )
  const ratio = totalCount > 0 ? Math.round((discoveredInListCount / totalCount) * 100) : 0

  return (
    <Box component="section" aria-label="빵집 도감" sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: 'primary.main' }}>
          빵집 도감
        </Typography>
        {!loading && !error && (
          <Typography component="span" sx={{ fontWeight: 800, color: 'terracotta.main' }}>
            {discoveredInListCount} / {totalCount}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1.5, wordBreak: 'keep-all' }}>
        모험 일지를 남긴 빵집이 발견 완료로 등록돼요. 전체 수는 지금 지도에 불러온 빵집 기준이에요.
        {extraDiscovered.length > 0 && ` (지금 목록에 없는 발견 ${extraDiscovered.length}곳도 있어요)`}
      </Typography>

      {error ? (
        <StatusMessage mood="error" title="빵집 도감을 불러오지 못했어요" description="잠시 후 다시 시도해주세요." actionLabel="다시 시도" onAction={reload} />
      ) : (
        <>
          {!loading && <XpTrack size="sm" percent={ratio} aria-hidden="true" sx={{ mb: 2 }} />}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {[{ id: 'all', name: '전체' }, ...DISTRICTS].map((district) => (
              <Chip
                key={district.id}
                label={district.id === 'all' ? '전체' : `${district.name} ${countsByDistrict[district.id]?.found ?? 0}/${countsByDistrict[district.id]?.total ?? 0}`}
                sx={{ height: 40, borderRadius: RADIUS.pill }}
                variant={districtId === district.id ? 'filled' : 'outlined'}
                color={districtId === district.id ? 'primary' : 'default'}
                onClick={() => {
                  setDistrictId(district.id)
                  setVisibleCount(PAGE_SIZE)
                }}
              />
            ))}
          </Box>

          {loading ? (
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>빵집 도감을 불러오는 중이에요…</Typography>
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.25 }}>
              {shown.map(({ bakery, discovered }) => (
                <Box component="li" key={bakery.id}>
                  <BakeryTile bakery={bakery} discovered={discovered} />
                </Box>
              ))}
            </Box>
          )}

          {!loading && visibleCount < entries.length && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
              <Button variant="outlined" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} sx={{ borderRadius: RADIUS.pill, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
                더 보기 ({shown.length} / {entries.length})
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default BakeryCollection
