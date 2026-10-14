import Box from '@mui/material/Box'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { WOOD_PLANK_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT } from '../../theme'

// 나무 간판 모양 버튼이에요. 올리면 살짝 떠오르고, 누르면 눌려 들어가요.
// 버튼(기본)이나 링크로 쓸 수 있어요: <WoodButton component={Link} to="/login">로그인</WoodButton>
// size="sm"은 헤더처럼 좁은 곳용이에요.
const SHADOW = (depth) => `inset 0 2px 0 rgba(255,220,160,0.25), 0 ${depth}px 0 rgba(33,20,10,0.4), 0 ${depth + 6}px 14px rgba(51,36,25,0.18)`

const WoodButton = ({ children, size = 'md', showStar = true, component = 'button', sx, ...rest }) => {
  const isSmall = size === 'sm'
  const buttonProps = component === 'button' ? { type: 'button' } : {}

  return (
    <Box
      component={component}
      {...buttonProps}
      {...rest}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isSmall ? 0.5 : 1,
        px: isSmall ? 2 : { xs: 3.5, sm: 4.5 },
        py: isSmall ? 0.7 : { xs: 1.2, sm: 1.4 },
        ...WOOD_PLANK_SX,
        borderRadius: isSmall ? '10px' : '16px',
        boxShadow: SHADOW(isSmall ? 2 : 4),
        fontFamily: DISPLAY_FONT,
        fontWeight: 900,
        fontSize: isSmall ? '0.85rem' : { xs: '1.1rem', sm: '1.25rem' },
        letterSpacing: '0.02em',
        lineHeight: 1.3,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: SHADOW(isSmall ? 3 : 6), filter: 'brightness(1.06)' },
        '&:active': { transform: 'translateY(2px)', boxShadow: SHADOW(isSmall ? 0 : 1) },
        '&:focus-visible': { outline: '3px solid', outlineColor: 'gold.main', outlineOffset: 3 },
        // 손가락(터치) 기기에서는 작은 크기도 최소 44px
        '@media (pointer: coarse)': { minHeight: 44 },
        ...sx,
      }}
    >
      {showStar && <StarRoundedIcon sx={{ fontSize: isSmall ? '1rem' : '1.35rem', color: 'gold.light' }} />}
      {children}
    </Box>
  )
}

export default WoodButton
