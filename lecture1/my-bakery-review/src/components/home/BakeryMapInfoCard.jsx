import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Rating from '@mui/material/Rating'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'
import { getBakeryPhoto } from '../../constants/bakeryPhotos'
import { DISTRICTS } from '../../constants/districts'
import { useRealBakeryPhotos } from '../../hooks/useRealBakeryPhotos'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 지도에서 마커를 누르면 지도 안쪽 아래에 뜨는 빵집 정보 카드예요.
// 마커 위치가 아니라 지도 안 고정 위치에 띄워서, 화면 밖으로 벗어나지 않아요.
const BakeryMapInfoCard = ({ bakery, onClose }) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const district = DISTRICTS.find((d) => d.id === bakery.districtId)

  return (
    <Box
      role="dialog"
      aria-label={`${bakery.name} 정보`}
      sx={{
        position: 'absolute',
        zIndex: 10,
        left: { xs: 12, sm: 16 },
        right: { xs: 12, sm: 'auto' },
        bottom: { xs: 12, sm: 16 },
        width: { sm: 340 },
        display: 'flex',
        gap: 1.5,
        p: 1.5,
        bgcolor: 'background.paper',
        borderRadius: RADIUS.lg,
        boxShadow: '0 12px 32px rgba(59,42,34,0.18)',
      }}
    >
      <Box
        component="img"
        src={getBakeryPhoto(bakery.id, photosByBakeryId, bakery.photoSlot)}
        alt=""
        sx={{
          width: { xs: 84, sm: 96 },
          height: { xs: 84, sm: 96 },
          flexShrink: 0,
          objectFit: 'cover',
          borderRadius: '999px 999px 12px 12px',
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {district && (
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'terracotta.main' }}>
            {district.name}
          </Typography>
        )}
        <Typography
          sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.3, pr: 3, color: 'text.primary' }}
          noWrap
        >
          {bakery.name}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25 }} noWrap>
          {bakery.address}
        </Typography>
        {bakery.rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Rating
              value={bakery.rating}
              precision={0.5}
              readOnly
              size="small"
              sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
            />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{bakery.rating.toFixed(1)}</Typography>
          </Box>
        )}
        <Button
          component={Link}
          to={`/bakery/${bakery.id}`}
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem !important' }} />}
          sx={{ mt: 'auto', alignSelf: 'flex-start', borderRadius: RADIUS.pill, px: 1.75, py: 0.4, fontSize: '0.8rem' }}
        >
          상세 보기
        </Button>
      </Box>
      <IconButton
        onClick={onClose}
        aria-label="정보 카드 닫기"
        size="small"
        sx={{ position: 'absolute', top: 6, right: 6, color: 'text.secondary' }}
      >
        <CloseIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
    </Box>
  )
}

export default BakeryMapInfoCard
