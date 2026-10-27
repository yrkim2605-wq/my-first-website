import { Box, Typography } from '@mui/material'
import Logo from '../common/Logo'
import { CLINIC } from '../../constants/siteData'

const FOOTER_BG = '#00746f'

const Footer = () => {
  return (
    <Box sx={{ bgcolor: FOOTER_BG, color: 'white', overflow: 'hidden' }}>
      {/* 시안의 큰 글자: 위쪽이 살짝 잘려 보이도록 위로 끌어올려요 */}
      <Typography
        aria-hidden
        sx={{
          fontFamily: 'fontFamilySerif',
          fontWeight: 700,
          fontSize: '13.4vw',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          mt: '-0.1em',
          mx: '-0.5vw',
        }}
      >
        Dr. Evers Clinic
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 0 },
          px: { xs: 3, md: 5 },
          pt: 6,
          pb: 8,
        }}
      >
        <Box sx={{ width: { md: 350 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 4 }}>
          <Logo />
          <Typography sx={{ fontSize: 11, opacity: 0.8 }}>Dr. Evers. All rights reserved.</Typography>
        </Box>
        <Box sx={{ fontSize: 14, lineHeight: 2, color: 'rgba(255, 255, 255, 0.75)' }}>
          <div>개인정보 처리방침</div>
          <div>
            <Box component="span" sx={{ mr: 1.5 }}>상호명</Box>
            닥터에버스 부산서면점
          </div>
          <div>
            <Box component="span" sx={{ mr: 1.5 }}>주소</Box>
            {CLINIC.address}
          </div>
          <div>
            <Box component="span" sx={{ mr: 1.5 }}>전화</Box>
            {CLINIC.phone}
            <Box component="span" sx={{ mx: 1.5 }}>|</Box>
            <Box component="span" sx={{ mr: 1.5 }}>팩스</Box>
            {CLINIC.fax}
          </div>
        </Box>
      </Box>
    </Box>
  )
}

export default Footer
