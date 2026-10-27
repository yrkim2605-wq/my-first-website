import { Box, ButtonBase, Typography } from '@mui/material'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'

const QUICK_ITEMS = [
  { id: 'kakao', label: '카톡상담', Icon: ChatBubbleIcon, onClick: () => {} },
  { id: 'reserve', label: '네이버 예약', Icon: CalendarMonthOutlinedIcon, onClick: () => {} },
  {
    id: 'clinic',
    label: '지점안내',
    Icon: PlaceOutlinedIcon,
    onClick: () => document.getElementById('clinic')?.scrollIntoView({ behavior: 'smooth' }),
  },
]

// 화면 오른쪽에 붙어 있는 세로 퀵메뉴 (모바일에서는 숨김)
const QuickMenu = () => {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        right: 14,
        top: '60%',
        transform: 'translateY(-50%)',
        zIndex: 1100,
        bgcolor: 'primary.dark',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {QUICK_ITEMS.map(({ id, label, Icon, onClick }) => (
        <ButtonBase
          key={id}
          onClick={onClick}
          sx={{
            flexDirection: 'column',
            gap: 0.75,
            width: 72,
            py: 2,
            color: 'white',
            '&:hover': { bgcolor: 'primary.main' },
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: 10.5 }}>{label}</Typography>
        </ButtonBase>
      ))}
    </Box>
  )
}

export default QuickMenu
