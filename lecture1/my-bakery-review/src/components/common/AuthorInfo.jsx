import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getAuthorLevel } from '../../utils/authorLevel'
import { RADIUS } from '../../theme'

// 작성자 표시: 레벨 캐릭터 아바타 · 닉네임 · 레벨 태그 (+ 아래 줄에 날짜 같은 보조 정보)
// 커뮤니티 목록 · 글 상세 · 댓글 · 빵집 리뷰에서 똑같이 보이도록 한곳에서 그려요.
const AuthorInfo = ({ author, level = getAuthorLevel(author), caption, avatarSize = 32, sx }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, ...sx }}>
      <Box
        aria-hidden="true"
        sx={{
          width: avatarSize,
          height: avatarSize,
          flexShrink: 0,
          borderRadius: RADIUS.round,
          bgcolor: 'butter.main',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        {level?.iconImage ? (
          <Box component="img" src={level.iconImage} alt="" sx={{ width: '88%', height: '88%', objectFit: 'contain' }} />
        ) : (
          author.slice(0, 1)
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
            {author}
          </Typography>
          {level && (
            <Box
              component="span"
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: RADIUS.pill,
                bgcolor: 'butter.main',
                color: 'butter.contrastText',
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
              }}
            >
              {level.name}
            </Box>
          )}
        </Box>
        {caption && (
          <Typography component="div" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
            {caption}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default AuthorInfo
