import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { NavLink } from 'react-router-dom'
import { MOCK_USER } from '../../constants/userProfile'
import { getLevelProgress } from '../../utils/levelUtils'
import { RADIUS } from '../../theme'

// 헤더 오른쪽의 작은 레벨 칩: 캐릭터 · 레벨 이름 · 다음 레벨까지 진행률
// 누르면 마이페이지로 가요 (레벨북은 마이페이지에서 열 수 있어요).
const HeaderLevelBadge = () => {
  const progress = getLevelProgress(MOCK_USER.visitedBakeryIds.length, MOCK_USER.totalHearts)
  const { currentLevel } = progress

  return (
    <Box
      component={NavLink}
      to="/mypage"
      aria-label={`내 레벨 ${currentLevel.name}, 다음 레벨까지 ${progress.percent}%`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        pl: 0.5,
        pr: { xs: 1, sm: 1.5 },
        py: 0.5,
        borderRadius: RADIUS.pill,
        bgcolor: 'butter.main',
        color: 'butter.contrastText',
        textDecoration: 'none',
        transition: 'filter 0.15s ease',
        '&:hover': { filter: 'brightness(0.96)' },
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: RADIUS.round,
          bgcolor: 'background.paper',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {currentLevel.iconImage ? (
          <Box component="img" src={currentLevel.iconImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <Typography component="span" sx={{ fontSize: '1rem' }}>{currentLevel.emoji}</Typography>
        )}
      </Box>
      <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>
        {currentLevel.name}
      </Typography>
      <Box
        aria-hidden="true"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 48,
          height: 5,
          borderRadius: RADIUS.pill,
          bgcolor: 'rgba(110,69,24,0.18)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: `${progress.percent}%`, height: '100%', bgcolor: 'primary.main', borderRadius: RADIUS.pill }} />
      </Box>
      <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
        {progress.percent}%
      </Typography>
    </Box>
  )
}

export default HeaderLevelBadge
