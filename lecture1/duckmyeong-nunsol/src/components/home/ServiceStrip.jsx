import { Box, Container, Paper, Typography } from '@mui/material'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { CONTACTS } from '../../constants/siteData'

const ICONS = {
  tel: PhoneOutlinedIcon,
  branch: PhoneInTalkOutlinedIcon,
  kakao: ChatBubbleOutlineOutlinedIcon,
  order: LocalShippingOutlinedIcon,
}

// 고객지원 안내: 상품 영역보다 눈에 띄지 않도록 작고 차분하게
const ServiceStrip = () => {
  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 6 } }}>
      <Paper
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          borderRadius: 2,
          bgcolor: '#FAFAFA',
        }}
      >
        {CONTACTS.map((item) => {
          const Icon = ICONS[item.id]
          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: { xs: 1.5, md: 2 },
                cursor: 'pointer',
                '&:hover': { bgcolor: '#F3F3F3' },
                '&:not(:first-of-type)': { borderLeft: { md: '1px solid #E5E7EB' } },
                // 모바일 2열: 두 번째 줄 위 경계선
                '&:nth-of-type(n+3)': { borderTop: { xs: '1px solid #E5E7EB', md: 'none' } },
                '&:nth-of-type(odd)': { borderLeft: { xs: 'none' } },
              }}
            >
              <Icon sx={{ fontSize: 24, color: '#777' }} />
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Paper>
    </Container>
  )
}

export default ServiceStrip
