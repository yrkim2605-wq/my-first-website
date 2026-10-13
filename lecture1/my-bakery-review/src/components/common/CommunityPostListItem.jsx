import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import { Link } from 'react-router-dom'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../../constants/bakeryPhotos'
import AuthorInfo from './AuthorInfo'
import { DISPLAY_FONT } from '../../theme'

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
  photoBakeryId,
}) => {
  const photoSrc = BAKERY_PHOTO_BY_ID[photoBakeryId] || DEFAULT_BAKERY_PHOTO

  return (
    <Box
      component={Link}
      to={`/community/${id}`}
      sx={{
        display: 'flex',
        gap: { xs: 2, sm: 3 },
        py: { xs: 2.5, sm: 3 },
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid rgba(46,42,37,0.1)',
        '&:hover .post-title': { color: 'primary.main' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'terracotta.main', mb: 0.75 }}
        >
          {categoryLabel}
        </Typography>
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

      <Box
        component="img"
        src={photoSrc}
        alt=""
        loading="lazy"
        sx={{
          width: { xs: 80, sm: 132 },
          height: { xs: 80, sm: 132 },
          flexShrink: 0,
          objectFit: 'cover',
          // 위쪽이 둥근 아치 모양 썸네일
          borderRadius: '999px 999px 12px 12px',
          alignSelf: 'center',
        }}
      />
    </Box>
  )
}

export default CommunityPostListItem
