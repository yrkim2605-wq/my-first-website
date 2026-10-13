import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import { Link } from 'react-router-dom'
import PlaceIcon from '@mui/icons-material/Place'
import { getBakeryPhoto } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../hooks/useRealBakeryPhotos'
import { HOVER_LIFT_SX } from '../../constants/motion'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

const IMAGE_HEIGHT_BY_SIZE = { lg: 220, default: 150, sm: 96 }
const PADDING_BY_SIZE = { lg: 3, default: 2.5, sm: 1.75 }
const CLAMP_BY_SIZE = { lg: 3, default: 2, sm: 1 }
const AUTHOR_FONT_BY_SIZE = { lg: '1rem', default: '0.95rem', sm: '0.85rem' }

// 모험 일지 모양 리뷰 카드: 왼쪽에 가죽 제본(고리 구멍) · 줄 노트 종이 · 사진은 테두리를 둘러 붙인 느낌이에요.
// 작성자는 레벨 메달 + 닉네임 + 레벨 칭호를 크게 보여줘요. (경험치 수치는 실제 데이터가 없어서 보여주지 않아요)
const PopularReviewCard = ({
  bakeryId,
  bakeryName,
  bakeryEmoji,
  bakeryIconImage,
  avatarEmoji,
  avatarImage,
  avatarScale,
  levelName,
  author,
  rating,
  content,
  size = 'default',
}) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const photoSrc = getBakeryPhoto(bakeryId, photosByBakeryId)

  return (
    <Card
      elevation={0}
      component={Link}
      to={`/bakery/${bakeryId}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        pl: '14px', // 왼쪽 제본 띠 자리
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        ...PARCHMENT_SX,
        // 노트의 가로 줄
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0 27px, rgba(201,165,106,0.26) 27px 28px), ${PARCHMENT_SX.backgroundImage}`,
        borderRadius: RADIUS.lg,
        // 가죽 제본 띠 + 고리 구멍
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 14,
          backgroundColor: '#6b4423',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #f9edcb 3px, rgba(0,0,0,0.35) 3.5px, transparent 4.5px)',
          backgroundSize: '14px 30px',
          backgroundPosition: '0 12px',
          borderRight: '2px solid #3e2713',
          pointerEvents: 'none',
        },
        ...HOVER_LIFT_SX,
        '@media (hover: hover)': {
          '&:hover': {
            ...HOVER_LIFT_SX['@media (hover: hover)']['&:hover'],
            borderColor: 'gold.main',
          },
          '&:hover .review-photo': { transform: 'scale(1.03)' },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: IMAGE_HEIGHT_BY_SIZE[size],
          flexShrink: 0,
          overflow: 'hidden',
          m: 1.25,
          mb: 0,
          borderRadius: '10px',
          border: '2px solid #c9a56a',
          transition: 'height 0.35s ease',
        }}
      >
        <Box
          component="img"
          src={photoSrc}
          alt={`${bakeryName} 리뷰 사진`}
          loading="lazy"
          className="review-photo"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
          }}
        />
      </Box>

      <Box sx={{ p: PADDING_BY_SIZE[size], flexGrow: 1, display: 'flex', flexDirection: 'column', transition: 'padding 0.35s ease' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 1, rowGap: 0.5, mb: 1 }}>
          {/* 좁으면 별점이 아랫줄로 내려가서 닉네임이 잘리지 않아요 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: '1 1 140px' }}>
            <Box sx={{ width: 46, height: 46, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              {avatarImage ? (
                <Box
                  component="img"
                  src={avatarImage}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${avatarScale ?? 1})` }}
                />
              ) : (
                <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{avatarEmoji}</Typography>
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: AUTHOR_FONT_BY_SIZE[size], lineHeight: 1.25 }} noWrap>
                {author}
              </Typography>
              {levelName && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    mt: 0.25,
                    px: 0.9,
                    py: 0.1,
                    borderRadius: RADIUS.pill,
                    bgcolor: 'wood.main',
                    color: 'gold.light',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    lineHeight: 1.6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {levelName}
                </Box>
              )}
            </Box>
          </Box>
          <Rating
            value={rating}
            precision={0.5}
            readOnly
            size="small"
            sx={{ flexShrink: 0, '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: CLAMP_BY_SIZE[size],
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {content}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto', pt: 0.75, borderTop: '1px dashed rgba(201,165,106,0.7)' }}>
          {bakeryIconImage ? (
            <Box component="img" src={bakeryIconImage} alt="" sx={{ width: 18, height: 18, objectFit: 'contain' }} />
          ) : bakeryEmoji ? (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{bakeryEmoji}</Typography>
          ) : (
            <PlaceIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            방문지
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }} noWrap>
            {bakeryName}
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default PopularReviewCard
