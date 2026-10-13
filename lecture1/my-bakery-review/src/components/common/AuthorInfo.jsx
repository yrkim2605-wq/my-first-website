import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getAuthorLevel } from '../../utils/authorLevel'
import { RADIUS } from '../../theme'

// 작성자 표시: 레벨 캐릭터 아바타 · 닉네임 · 레벨 태그 (+ 아래 줄에 날짜 같은 보조 정보)
// 커뮤니티 목록 · 글 상세 · 댓글 · 빵집 리뷰에서 똑같이 보이도록 한곳에서 그려요.
const AuthorInfo = ({ author, level = getAuthorLevel(author), caption, avatarSize = 42, sx }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, ...sx }}>
      <Box
        aria-hidden="true"
        sx={{
          width: avatarSize,
          height: avatarSize,
          flexShrink: 0,
          // 메달이 있으면 동그랗게 자르지 않아요 (리본 · 왕관이 잘리지 않게)
          borderRadius: level?.iconImage ? 0 : RADIUS.round,
          bgcolor: level?.iconImage ? 'transparent' : 'butter.main',
          display: 'grid',
          placeItems: 'center',
          overflow: level?.iconImage ? 'visible' : 'hidden',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        {level?.iconImage ? (
          <Box component="img" src={level.iconImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }} />
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
                fontSize: '0.75rem',
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
