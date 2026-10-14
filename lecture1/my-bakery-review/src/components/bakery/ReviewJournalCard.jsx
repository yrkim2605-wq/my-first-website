import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import AuthorInfo from '../common/AuthorInfo'
import ReportButton from '../common/ReportButton'
import { useProfile } from '../../hooks/useProfile'
import { JOURNAL_PAPER_SX } from '../../constants/rpgStyles'
import { RADIUS } from '../../theme'

// 빵집 상세의 리뷰 한 장 = 모험 일지 한 쪽.
// card: { id, authorName, level, rating, content, photo, dateLabel, heartCount, isMine, kind }
//   kind 'local'  : 이 브라우저에 저장된 리뷰 (내 것이면 수정 · 삭제 버튼이 보여요)
//   kind 'sample' : 처음부터 들어 있던 예시 리뷰 (실제 사용자가 쓴 글이 아니라서 "예시" 표시를 붙여요)
//
// 배치: 사진이 있으면 PC에서는 왼쪽(작성자 · 본문 · 버튼) + 오른쪽(사진) 두 칸, 모바일에서는 위아래로 쌓아요.
//       사진이 없으면 한 칸이고, 내용 높이에 맞춰 줄어들어요 (빈 줄 · 빈 여백 없음).
const PHOTO_COLUMN_WIDTH = 224

const ReviewJournalCard = ({ card, onEdit, onDelete }) => {
  const { profile, isAccountMode } = useProfile()
  const hasPhoto = Boolean(card.photo)
  const hasTag = card.isMine || card.kind === 'sample'
  // 실제 사용자가 쓴 일지(예시 글은 DB에 없어요)를 로그인한 다른 사용자가 볼 때만 신고 버튼이 있어요
  const canReport = card.kind === 'local' && !card.isMine && isAccountMode && Boolean(profile)
  const hasFooter = card.kind === 'sample' || card.isMine || canReport

  return (
    <Box
      component="article"
      sx={{
        ...JOURNAL_PAPER_SX,
        // 왼쪽은 바인더 구멍 폭만큼, 오른쪽은 왼쪽 글 여백과 비슷하게 맞춰요
        pt: { xs: 2, sm: 2.5 },
        pb: { xs: 1.5, sm: 2 },
        pl: { xs: '30px', sm: '38px' },
        pr: { xs: 2, sm: 3 },
        borderRadius: RADIUS.lg,
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: hasPhoto ? `minmax(0, 1fr) ${PHOTO_COLUMN_WIDTH}px` : 'minmax(0, 1fr)' },
        columnGap: { sm: 3 },
        rowGap: 1.25,
        alignItems: 'start',
        ...(card.isMine && { borderColor: 'gold.main', boxShadow: `${JOURNAL_PAPER_SX.boxShadow}, 0 0 0 2px rgba(226,176,74,0.55)` }),
      }}
    >
      {/* 글 칸: 작성자(왼쪽) · 표시 + 별점(오른쪽) / 본문 / 버튼 */}
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.25, height: { sm: hasPhoto ? '100%' : 'auto' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', columnGap: 1.5, rowGap: 0.5, flexWrap: 'wrap' }}>
          <AuthorInfo author={card.authorName} level={card.level} caption={card.dateLabel} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { sm: 'auto' } }}>
            {hasTag && (
              <Chip
                size="small"
                label={card.isMine ? '내 기록' : '예시'}
                sx={{
                  fontWeight: 800,
                  bgcolor: card.isMine ? 'wood.main' : 'butter.main',
                  color: card.isMine ? 'gold.light' : 'butter.contrastText',
                }}
              />
            )}
            <Rating value={card.rating} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{card.content}</Typography>

        {hasFooter && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mt: { sm: hasPhoto ? 'auto' : 0 } }}>
            {card.kind === 'sample' ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                <FavoriteBorderIcon sx={{ fontSize: '1rem' }} />
                {card.heartCount}
              </Box>
            ) : (
              <span />
            )}
            {canReport && <ReportButton targetType="review" targetId={card.id} sx={{ ml: 'auto', mr: -1 }} />}
            {card.isMine && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', mr: -1 }}>
                <Button size="small" startIcon={<EditIcon />} onClick={onEdit} sx={{ minHeight: 44 }}>
                  고쳐 쓰기
                </Button>
                <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete} sx={{ minHeight: 44 }}>
                  지우기
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* 사진 칸: PC에서는 오른쪽 위, 모바일에서는 글 아래에 가로 가득 */}
      {hasPhoto && (
        <Box
          component="img"
          src={card.photo}
          alt={`${card.authorName}님이 붙인 사진`}
          loading="lazy"
          sx={{
            display: 'block',
            width: '100%',
            aspectRatio: { xs: '16 / 9', sm: '3 / 2' },
            objectFit: 'cover',
            borderRadius: RADIUS.md,
            border: '2px solid #c9a56a',
            gridRow: { sm: 1 },
            gridColumn: { sm: 2 },
          }}
        />
      )}
    </Box>
  )
}

export default ReviewJournalCard
