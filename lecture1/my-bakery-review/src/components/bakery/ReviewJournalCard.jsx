import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import AuthorInfo from '../common/AuthorInfo'
import { JOURNAL_PAPER_SX } from '../../constants/rpgStyles'
import { RADIUS } from '../../theme'

// 빵집 상세의 리뷰 한 장 = 모험 일지 한 쪽.
// card: { id, authorName, level, rating, content, photo, dateLabel, heartCount, isMine, kind }
//   kind 'local'  : 이 브라우저에 저장된 리뷰 (내 것이면 수정 · 삭제 버튼이 보여요)
//   kind 'sample' : 처음부터 들어 있던 예시 리뷰 (실제 사용자가 쓴 글이 아니라서 "예시" 표시를 붙여요)
const ReviewJournalCard = ({ card, onEdit, onDelete }) => (
  <Box
    component="article"
    sx={{
      ...JOURNAL_PAPER_SX,
      p: { xs: 2, sm: 2.5 },
      pl: { xs: '30px', sm: '34px' },
      borderRadius: RADIUS.lg,
      ...(card.isMine && { borderColor: 'gold.main', boxShadow: `${JOURNAL_PAPER_SX.boxShadow}, 0 0 0 2px rgba(226,176,74,0.55)` }),
    }}
  >
    {(card.isMine || card.kind === 'sample') && (
      <Chip
        size="small"
        label={card.isMine ? '내 기록' : '예시'}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          fontWeight: 800,
          bgcolor: card.isMine ? 'wood.main' : 'butter.main',
          color: card.isMine ? 'gold.light' : 'butter.contrastText',
        }}
      />
    )}

    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap', pr: card.isMine || card.kind === 'sample' ? 7 : 0 }}>
      <AuthorInfo author={card.authorName} level={card.level} caption={card.dateLabel} />
      <Rating value={card.rating} precision={0.5} readOnly size="small" sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }} />
    </Box>

    <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, mb: 1.25, whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{card.content}</Typography>

    {card.photo && (
      <Box
        component="img"
        src={card.photo}
        alt={`${card.authorName}님이 붙인 사진`}
        loading="lazy"
        sx={{ display: 'block', width: { xs: '100%', sm: 220 }, maxHeight: 220, objectFit: 'cover', borderRadius: RADIUS.md, border: '2px solid #c9a56a', mb: 1.25 }}
      />
    )}

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      {card.kind === 'sample' ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
          <FavoriteBorderIcon sx={{ fontSize: '1rem' }} />
          {card.heartCount}
        </Box>
      ) : (
        <span />
      )}
      {card.isMine && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={onEdit} sx={{ minHeight: 36 }}>
            고쳐 쓰기
          </Button>
          <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete} sx={{ minHeight: 36 }}>
            지우기
          </Button>
        </Box>
      )}
    </Box>
  </Box>
)

export default ReviewJournalCard
