import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import Rating from '@mui/material/Rating'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'
import BakeryPhoto from '../common/BakeryPhoto'
import { DISTRICTS } from '../../constants/districts'
import { useBakeryRatings } from '../../hooks/useBakeryRatings'
import { formatAverage } from '../../utils/bakeryRating'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 지도 Hero의 빵집 미리보기 카드 (마커 정보를 보여주는 유일한 카드예요)
// 처음에는 대표 빵집, 마커를 누르면 그 빵집을 보여주고, [상세 보기]로 상세페이지에 가요.
// variant="overlay": 넓은 화면에서 지도 위에 뜨는 세로형 / variant="compact": 모바일에서 지도 아래 가로형
// onClose: 넣으면 오른쪽 위에 닫기(✕) 버튼이 생겨요 (넓은 화면 지도 위 카드에서만 써요)
const BakeryMapPreviewCard = ({ bakery, isSelected, variant = 'overlay', onClose, sx }) => {
  const district = DISTRICTS.find((d) => d.id === bakery.districtId)
  const isCompact = variant === 'compact'
  // 계정 모드: 서버 집계의 평균 별점 · 리뷰 개수 / 로컬 모드: 예전 방식(빵집 정보의 rating)
  const { isEnabled: ratingsEnabled, getRating } = useBakeryRatings()
  const ratingInfo = ratingsEnabled ? getRating(bakery.id) : null
  const average = ratingInfo ? ratingInfo.average : bakery.rating
  const hasRating = ratingInfo ? ratingInfo.status === 'ready' : bakery.rating > 0

  return (
    <Box
      aria-live="polite"
      sx={{
        display: 'flex',
        flexDirection: isCompact ? 'row' : 'column',
        alignItems: isCompact ? 'center' : 'stretch',
        gap: isCompact ? 1.5 : 0,
        p: isCompact ? 1.25 : 1.5,
        ...PARCHMENT_SX,
        borderRadius: RADIUS.lg,
        boxShadow: `${PARCHMENT_SX.boxShadow}, 0 10px 24px rgba(59,42,34,0.14)`,
        position: 'relative',
        ...sx,
      }}
    >
      {onClose && (
        <IconButton
          onClick={onClose}
          aria-label="빵집 정보 카드 닫기"
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 1,
            width: 32,
            height: 32,
            bgcolor: 'parchment.light',
            color: 'wood.main',
            border: '2px solid #c9a56a',
            '&:hover': { bgcolor: 'parchment.dark', color: 'primary.main' },
          }}
        >
          <CloseIcon sx={{ fontSize: '1.05rem' }} />
        </IconButton>
      )}
      <Box
        sx={{
          width: isCompact ? 72 : '100%',
          height: isCompact ? 72 : 128,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: isCompact ? '999px 999px 10px 10px' : '999px 999px 12px 12px',
          mb: isCompact ? 0 : 1.25,
        }}
      >
        <BakeryPhoto bakeryId={bakery.id} name={bakery.name} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'primary.main', mb: 0.25 }}>
          {isSelected ? '선택한 빵집' : '오늘의 추천 빵집'}
        </Typography>
        <Typography
          sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: isCompact ? '1rem' : '1.1rem', lineHeight: 1.35 }}
          noWrap
          title={bakery.name}
        >
          {bakery.name}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.25 }} noWrap>
          {district ? `${district.name} · ` : ''}
          {bakery.address}
        </Typography>
        {/* 평점은 실제 데이터가 있을 때만 보여줘요 (없으면 이 줄을 숨겨요) */}
        {hasRating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Rating
              value={average}
              precision={0.5}
              readOnly
              size="small"
              sx={{ fontSize: '1rem', '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
            />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatAverage(average)}</Typography>
            {ratingInfo && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>({ratingInfo.count})</Typography>}
          </Box>
        )}
        {ratingInfo?.status === 'empty' && <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'terracotta.dark', mt: 0.5 }}>아직 별점이 없어요</Typography>}
        {!isCompact && (
          <Button
            component={Link}
            to={`/bakery/${bakery.id}`}
            variant="contained"
            size="small"
            fullWidth
            endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem !important' }} />}
            aria-label={`${bakery.name} 상세 보기`}
            sx={{ mt: 1.25, borderRadius: RADIUS.pill, py: 0.6, fontWeight: 700 }}
          >
            상세 보기
          </Button>
        )}
      </Box>
      {isCompact && (
        <Button
          component={Link}
          to={`/bakery/${bakery.id}`}
          variant="contained"
          size="small"
          aria-label={`${bakery.name} 상세 보기`}
          sx={{ flexShrink: 0, borderRadius: RADIUS.pill, px: 1.5, py: 0.6, fontWeight: 700, minWidth: 0 }}
        >
          상세 보기
        </Button>
      )}
    </Box>
  )
}

export default BakeryMapPreviewCard
