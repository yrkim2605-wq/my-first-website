import { Box, Typography } from '@mui/material'

// 동그라미 안의 DE 로고 + 병원 이름. 헤더와 푸터에서 같이 써요.
const Logo = ({ showBranch = true, onClick }) => {
  return (
    <Box
      onClick={onClick}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'white', cursor: onClick ? 'pointer' : 'default' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          border: '2px solid white',
          borderRadius: '50%',
          fontFamily: 'fontFamilySerif',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        DE
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>
          Dr. Evers{' '}
          <Box component="span" sx={{ fontSize: 8, letterSpacing: 1 }}>
            CLINIC
          </Box>
        </Typography>
        {showBranch && (
          <Typography sx={{ fontSize: 9, lineHeight: 1.3, opacity: 0.9 }}>닥터에버스클리닉 부산서면점</Typography>
        )}
      </Box>
    </Box>
  )
}

export default Logo
