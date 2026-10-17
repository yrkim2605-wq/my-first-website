import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import PlaceIcon from '@mui/icons-material/Place'
import WoodButton from '../common/WoodButton'
import { DISTRICTS } from '../../constants/districts'
import { JOURNAL_PAPER_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 내 모험 일지 목록: 내가 쓴 일지를 최신 순으로 보여줘요. (왼쪽 제본 띠가 14px라서 글은 34px부터 시작해요. p와 pl을 같이 쓰면 JOURNAL_PAPER_SX의 pl 순서 때문에 pl이 덮여서 py/pr/pl로 나눠 줘요.) 고쳐 쓰거나 지우는 건 해당 빵집 페이지에서 해요.
const MyLogList = ({ reviews }) => (
  <Box component="section" aria-label="내 모험 일지" sx={{ mb: 6 }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
      <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: 'primary.main' }}>
        내 모험 일지
      </Typography>
      <Typography component="span" sx={{ fontWeight: 800, color: 'terracotta.dark' }}>
        {reviews.length}개
      </Typography>
    </Box>

    {reviews.length === 0 ? (
      <Box sx={{ border: '2px dashed rgba(201,165,106,0.9)', borderRadius: RADIUS.lg, px: 3, py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 2, wordBreak: 'keep-all' }}>
          아직 남긴 일지가 없어요. 빵집을 찾아 첫 모험 일지를 남기면 EXP를 받고 도감에 등록돼요.
        </Typography>
        <WoodButton component={Link} to="/" size="sm">
          빵집 탐험하러 가기
        </WoodButton>
      </Box>
    ) : (
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {reviews.map((review) => (
          <Box component="li" key={review.id} sx={{ ...JOURNAL_PAPER_SX, borderRadius: RADIUS.lg, py: 2, pr: 2, pl: '34px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
              <Box component={Link} to={`/bakery/${review.bakeryId}`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0, minHeight: 44, color: 'primary.main', textDecoration: 'none', fontWeight: 800, '&:hover': { textDecoration: 'underline' } }}>
                <PlaceIcon sx={{ fontSize: '1.05rem' }} />
                <Box component="span" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900 }}>
                  {review.bakeryName}
                </Box>
              </Box>
              <Rating value={review.rating} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }} />
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 0.75 }}>
              {DISTRICTS.find((district) => district.id === review.districtId)?.name ?? '지역 정보 없음'} · {review.createdAt.slice(0, 10)}
              {review.updatedAt !== review.createdAt && ' · 수정됨'}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'keep-all' }}>
              {review.content}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Button component={Link} to={`/bakery/${review.bakeryId}`} size="small" sx={{ minHeight: 44 }}>
                보러 가기 / 고쳐 쓰기
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    )}
  </Box>
)

export default MyLogList
