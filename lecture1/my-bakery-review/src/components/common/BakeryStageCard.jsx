import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import PlaceIcon from '@mui/icons-material/Place'
import { Link } from 'react-router-dom'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import BakeryPhoto from './BakeryPhoto'
import { useBookmarks } from '../../hooks/useBookmarks'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'
import { RADIUS } from '../../theme'

// 사진 위쪽을 둥근 아치 모양으로 깎아요. 사진이 낮으면 브라우저가 비율을 줄여 완만한 돔이 돼요.
const ARCH_RADIUS = '999px 999px 14px 14px'

const BakeryStageCard = ({
  id,
  name,
  districtLabel,
  signatureMenu,
  rating,
  heartCount,
  reviewCount = 0,
  ratingStatus, // 계정 모드: 'ready'(평균 있음) | 'empty'(리뷰 없음) | 'loading' | 'error'. 없으면(로컬 모드) 예전 방식 그대로예요
  isNew = false,
  tags = [],
  variant = 'default',
  height,
  photoSlot,
  highlighted = false, // 홈 지도에서 고른 빵집이면 선택 표시
  discovered = false, // 내가 모험 일지를 남긴 빵집이면 "발견 완료" 도장 (빵집 도감)
  discovery = false, // 탐험 도감의 "발견 카드" 모양: 양피지 카드 + 금색 NEW 리본 (새로 등록된 빵집용)
  quest = false, // 퀘스트 보드 모양: 양피지 카드 + QUEST 라벨 + [빵집 탐험하기] 표시 (보상 · 경험치 같은 건 보여주지 않아요)
}) => {
  // 찜 상태는 빵집 상세 · 마이페이지와 같은 목록을 써서, 어디서 눌러도 똑같이 보여요
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(id)
  const hasReviews = ratingStatus ? ratingStatus === 'ready' : reviewCount > 0 || rating > 0

  const handleBookmarkClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    toggleBookmark({ id, name, districtLabel, signatureMenu, photoSlot })
  }

  return (
    <Card
      elevation={0}
      component={Link}
      to={`/bakery/${id}`}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: height ?? '100%',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        border: '1px solid rgba(59,42,34,0.08)',
        boxShadow: 'none',
        ...((quest || discovery) && { ...PARCHMENT_SX, borderRadius: RADIUS.lg }),
        ...(highlighted && {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
        }),
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        // 마우스가 있는 기기에서만 호버 효과 (터치 화면은 호버에 의존하지 않아요)
        '@media (hover: hover)': {
          '&:hover': {
            transform: 'translateY(-3px)',
            borderColor: 'rgba(123,45,59,0.35)',
            boxShadow: '0 14px 28px rgba(59,42,34,0.12)',
            // 퀘스트 카드는 금빛 테두리로 은은하게 강조해요
            ...((quest || discovery) && {
              borderColor: 'gold.main',
              boxShadow: `inset 0 0 0 3px rgba(255,248,225,0.7), 0 0 0 3px rgba(226,176,74,0.5), 0 10px 22px rgba(59,42,34,0.16)`,
            }),
          },
          '&:hover .quest-cta': { transform: 'translateY(-2px)' },
          '&:hover .bakery-name': { color: 'primary.main' },
          '&:hover .bakery-photo': { transform: 'scale(1.03)' },
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 },
      }}
    >
      {quest && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: 14,
            left: 16,
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
            px: 1.1,
            py: 0.3,
            ...WOOD_PLANK_SX,
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'gold.light',
          }}
        >
          <StarRoundedIcon sx={{ fontSize: '0.9rem' }} />
          QUEST
        </Box>
      )}
      {discovered && (
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: 14,
            right: 16,
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.3,
            px: 1,
            py: 0.2,
            borderRadius: RADIUS.pill,
            bgcolor: 'gold.main',
            color: 'wood.dark',
            border: '2px solid #6b4423',
            boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
            fontSize: '0.7rem',
            fontWeight: 800,
          }}
        >
          <StarRoundedIcon sx={{ fontSize: '0.85rem' }} />
          발견 완료
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mx: 1.5,
          mt: 1.5,
          borderRadius: ARCH_RADIUS,
          bgcolor: 'butter.main',
          // 사진 높이를 고정해 모든 카드의 크롭 비율을 맞춰요 (캐러셀처럼 카드 높이가 정해진 경우도)
          ...(height
            ? { height: { xs: 240, sm: 260, md: 280 }, flexShrink: 0 }
            : variant === 'featured'
              ? { height: { xs: 220, sm: 290, md: 330 }, flexShrink: 0 }
              : variant === 'square'
                ? { aspectRatio: '1 / 1', maxHeight: { xs: 220, sm: 290, md: 330 }, flexShrink: 0 }
                : { height: 190, flexShrink: 0 }),
        }}
      >
        <BakeryPhoto bakeryId={id} name={name} className="bakery-photo" sx={{ transition: 'transform 0.4s ease' }} />
        {isNew && (
          <Chip
            label="NEW"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              bgcolor: 'terracotta.dark', // 크림색 글자와 대비 4.5:1 이상이 되도록 진한 테라코타
              color: 'terracotta.contrastText',
              // 발견 카드에서는 금색 리본처럼: 금색 바탕 + 나무색 글자 + 테두리
              ...(discovery && {
                bgcolor: 'gold.main',
                color: 'wood.dark',
                border: '2px solid #6b4423',
                fontWeight: 800,
                boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
              }),
            }}
          />
        )}
        <IconButton
          onClick={handleBookmarkClick}
          aria-label={bookmarked ? `${name} 찜 해제` : `${name} 찜하기`}
          aria-pressed={bookmarked}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 40,
            height: 40,
            bgcolor: 'rgba(251,246,234,0.92)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          {bookmarked ? (
            <BookmarkIcon fontSize="small" sx={{ color: 'primary.main' }} />
          ) : (
            <BookmarkBorderIcon fontSize="small" sx={{ color: 'primary.main' }} />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 0.75, pt: 2 }}>
        {highlighted && (
          <Typography
            component="span"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: '0.75rem', fontWeight: 700, color: 'primary.main' }}
          >
            <PlaceIcon sx={{ fontSize: '0.95rem' }} />
            지도에서 선택한 빵집
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant="h3"
            className="bakery-name"
            sx={{
              fontSize: variant === 'featured' ? '1.2rem' : '1.12rem',
              lineHeight: 1.35,
              transition: 'color 0.15s ease',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.7em', // 이름이 한 줄이어도 두 줄 높이를 차지해서 카드끼리 줄이 맞아요
            }}
            title={name}
          >
            {name}
          </Typography>
          {districtLabel && (
            <Typography
              component="span"
              sx={{ fontSize: '0.8125rem', fontWeight: 700, color: 'text.secondary', flexShrink: 0, pt: 0.4 }}
            >
              {districtLabel}
            </Typography>
          )}
        </Box>

        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }} noWrap>
          {signatureMenu ? `대표 메뉴 · ${signatureMenu}` : '메뉴 정보 준비 중'}
        </Typography>

        {hasReviews ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 24, fontSize: '0.8125rem', color: 'text.secondary' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={rating}
                precision={0.5}
                readOnly
                size="small"
                sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
              />
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: 'text.primary' }}>
                {rating.toFixed(1)}
              </Typography>
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: '0.95rem' }} />
              {reviewCount}
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <FavoriteBorderIcon sx={{ fontSize: '0.95rem' }} />
              {heartCount}
            </Box>
          </Box>
        ) : (
          // 평점 줄과 같은 높이로 맞춰서, 카드마다 아래쪽 정보 위치가 같아요
          <Typography sx={{ display: 'flex', alignItems: 'center', minHeight: 24, fontSize: '0.8125rem', color: 'primary.main', fontWeight: 600 }} noWrap>
            {ratingStatus === 'loading' ? '별점을 불러오는 중이에요…' : ratingStatus === 'error' ? '별점을 불러오지 못했어요' : ratingStatus === 'empty' ? '아직 별점이 없어요 · 첫 리뷰를 남겨주세요' : '아직 리뷰가 없어요 · 첫 리뷰를 남겨주세요'}
          </Typography>
        )}

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ bgcolor: 'rgba(143,166,126,0.18)', color: 'secondary.contrastText', borderRadius: RADIUS.pill }}
              />
            ))}
          </Box>
        )}
        {quest && (
          <Box
            className="quest-cta"
            aria-hidden="true"
            sx={{
              mt: 'auto',
              alignSelf: 'stretch',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              py: 0.8,
              ...WOOD_PLANK_SX,
              borderRadius: '12px',
              boxShadow: 'inset 0 2px 0 rgba(255,220,160,0.25), 0 3px 0 rgba(33,20,10,0.4)',
              fontSize: '0.9rem',
              fontWeight: 800,
              transition: 'transform 0.15s ease',
            }}
          >
            빵집 탐험하기
            <Box component="span" sx={{ color: 'gold.light' }}>
              →
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default BakeryStageCard
