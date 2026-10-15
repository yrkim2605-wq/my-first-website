import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import { formatAverage } from '../../utils/bakeryRating'

// 빵집 상세의 평균 별점 줄 (계정 모드): 서버 집계를 보여줘요.
//  ready  : 별 + 평균(소수점 첫째 자리) + 리뷰 개수
//  empty  : 리뷰가 0개 → 0점이 아니라 "아직 별점이 없어요"
//  loading: 아직 집계를 못 가져옴
//  error  : 불러오기에 실패 (리뷰 0개로 오해하지 않게 따로 안내)
const STAR_SX = { '& .MuiRating-iconFilled': { color: 'mustard.main' } }

const BakeryRatingSummary = ({ info }) => {
  if (info.status === 'ready') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }} aria-label={`평균 별점 ${formatAverage(info.average)}점, 리뷰 ${info.count}개`}>
        <Rating value={info.average} precision={0.5} readOnly size="small" sx={STAR_SX} />
        <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700 }}>
          {formatAverage(info.average)}
        </Typography>
        <Typography component="span" sx={{ fontSize: 'inherit', color: 'text.secondary' }}>
          (리뷰 {info.count}개)
        </Typography>
      </Box>
    )
  }
  if (info.status === 'loading') {
    return (
      <Typography component="span" role="status" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'text.secondary' }}>
        별점을 불러오는 중이에요…
      </Typography>
    )
  }
  if (info.status === 'error') {
    return (
      <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'text.secondary' }}>
        별점을 불러오지 못했어요
      </Typography>
    )
  }
  return (
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'terracotta.dark' }}>
      아직 별점이 없어요
    </Typography>
  )
}

export default BakeryRatingSummary
