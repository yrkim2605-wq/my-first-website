import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import { Link } from 'react-router-dom'
import { PhotoPlaceholder } from './BakeryPhoto'
import AuthorInfo from './AuthorInfo'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

const META_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }

// 커뮤니티 목록의 글 한 줄: 왼쪽에 글, 오른쪽에 작은 사진
const CommunityPostListItem = ({
  id,
  categoryLabel,
  title,
  author,
  authorLevel,
  content,
  heartCount,
  commentCount,
  createdAt,
  placeholderEmoji,
  photoUrl = null, // 글에 붙인 사진의 공개 주소 (없으면 아래의 이모지/예시 사진 그대로)
  isSample = false,
}) => {
  const [photoFailed, setPhotoFailed] = useState(false) // 사진을 못 불러오면(파일이 지워졌을 때 등) 이모지로 돌아가요
  const thumbnailSx = {
    width: { xs: 80, sm: 132 },
    height: { xs: 80, sm: 132 },
    flexShrink: 0,
    // 위쪽이 둥근 아치 모양 썸네일
    borderRadius: '999px 999px 12px 12px',
    alignSelf: 'center',
  }

  return (
    <Box
      component={Link}
      to={`/community/${id}`}
      sx={{
        display: 'flex',
        position: 'relative',
        gap: { xs: 2, sm: 3 },
        p: { xs: 2, sm: 2.5 },
        mt: 2,
        textDecoration: 'none',
        color: 'inherit',
        ...PARCHMENT_SX,
        borderRadius: RADIUS.lg,
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        // 압정
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -6,
          left: 22,
          width: 13,
          height: 13,
          borderRadius: '50%',
          backgroundColor: '#d9735e',
          border: '2px solid #3e2713',
          boxShadow: '0 2px 0 rgba(33,20,10,0.4)',
        },
        '@media (hover: hover)': { '&:hover': { transform: 'translateY(-2px)', borderColor: 'gold.main' } },
        '&:hover .post-title': { color: 'primary.main' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignSelf: 'flex-start', mb: 0.75 }}>
          <Box
            component="span"
            sx={{ px: 1, py: 0.1, borderRadius: RADIUS.pill, bgcolor: 'rgba(143,166,126,0.25)', color: 'secondary.contrastText', fontSize: '0.75rem', fontWeight: 800 }}
          >
            {categoryLabel}
          </Box>
          {isSample && (
            <Box
              component="span"
              sx={{ px: 1, py: 0.1, borderRadius: RADIUS.pill, border: '1px dashed', borderColor: 'text.secondary', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 800 }}
            >
              예시
            </Box>
          )}
        </Box>
        <Typography
          className="post-title"
          component="h2"
          sx={{
            fontFamily: DISPLAY_FONT,
            fontSize: { xs: '1.05rem', sm: '1.2rem' },
            fontWeight: 900,
            lineHeight: 1.4,
            mb: 0.75,
            transition: 'color 0.15s ease',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {content}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: { xs: 1.5, sm: 2 },
            rowGap: 0.5,
            mt: 'auto',
            fontSize: '0.8rem',
          }}
        >
          <AuthorInfo author={author} level={authorLevel} avatarSize={34} />
          {/* 모바일에서는 한 줄에 다 들어가도록 날짜를 숨겨요 (글 상세에서 볼 수 있어요) */}
          <Typography
            component="span"
            sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: 'inherit', color: 'text.secondary' }}
          >
            {createdAt}
          </Typography>
          <Box component="span" sx={META_SX} aria-label={`좋아요 ${heartCount}개`}>
            <FavoriteBorderIcon sx={{ fontSize: '0.95rem' }} />
            {heartCount}
          </Box>
          <Box component="span" sx={META_SX} aria-label={`댓글 ${commentCount}개`}>
            <ChatBubbleOutlineIcon sx={{ fontSize: '0.9rem' }} />
            {commentCount}
          </Box>
        </Box>
      </Box>

      {/* 사진을 붙인 글은 그 사진을, 사진이 없는 실제 글은 가짜 빵집 사진 대신 카테고리 이모지를 아치에 담아요 */}
      {photoUrl && !photoFailed ? (
        <Box component="img" src={photoUrl} alt="" loading="lazy" onError={() => setPhotoFailed(true)} sx={{ ...thumbnailSx, objectFit: 'cover', border: '2px solid rgba(201,165,106,0.7)' }} />
      ) : placeholderEmoji ? (
        <Box
          aria-hidden="true"
          sx={{
            ...thumbnailSx,
            display: 'grid',
            placeItems: 'center',
            fontSize: { xs: '2rem', sm: '3.2rem' },
            bgcolor: 'rgba(143,166,126,0.22)',
            border: '2px solid rgba(201,165,106,0.7)',
          }}
        >
          {placeholderEmoji}
        </Box>
      ) : (
        // 이모지도 사진도 없는 예시 글: 가짜 빵집 사진 대신 빵 기사 플레이스홀더
        <Box sx={{ ...thumbnailSx, overflow: 'hidden', border: '2px solid rgba(201,165,106,0.7)' }}>
          <PhotoPlaceholder label={`${title}: 아직 등록된 사진이 없어요`} />
        </Box>
      )}
    </Box>
  )
}

export default CommunityPostListItem
