import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { NavLink } from 'react-router-dom'
import { MOCK_USER } from '../../constants/userProfile'
import { getLevelProgress } from '../../utils/levelUtils'

const HeaderLevelBadge = () => {
  const progress = getLevelProgress(MOCK_USER.visitedBakeryIds.length, MOCK_USER.totalHearts)

  return (
    <Box
      component={NavLink}
      to="/mypage"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        px: '52px',
        py: '6.3px',
        mx: 'auto',
        borderRadius: 999,
        bgcolor: 'background.paper',
        border: '1px solid rgba(46,42,37,0.08)',
        boxShadow: '0 2px 8px rgba(51,36,25,0.06)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 14px rgba(51,36,25,0.12)',
        },
      }}
    >
      {progress.currentLevel.iconImage ? (
        <Box
          component="img"
          src={progress.currentLevel.iconImage}
          alt=""
          sx={{ width: 46, height: 42, objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
        />
      ) : (
        <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{progress.currentLevel.emoji}</Typography>
      )}
      <Box sx={{ minWidth: 220 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.25 }} noWrap>
            {progress.currentLevel.name}
          </Typography>
          {!progress.isMaxLevel && (
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 999,
                bgcolor: '#F3D9A8',
                color: '#7A4A16',
                fontSize: '0.65rem',
                fontWeight: 800,
                flexShrink: 0,
                lineHeight: 1.4,
              }}
            >
              {progress.nextLevel.name}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              flexGrow: 1,
              height: 7,
              borderRadius: 999,
              bgcolor: 'rgba(51,36,25,0.08)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progress.percent}%`,
                height: '100%',
                borderRadius: 999,
                backgroundImage: 'linear-gradient(90deg, #5C4433 0%, #E3B873 65%, #F6DFA8 100%)',
              }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'primary.main', flexShrink: 0 }}>
            {progress.percent}%
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default HeaderLevelBadge
