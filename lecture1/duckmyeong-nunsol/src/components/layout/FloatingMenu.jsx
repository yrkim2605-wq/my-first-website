import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Popover,
  Snackbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import EditNoteIcon from '@mui/icons-material/EditNote'
import PhoneIcon from '@mui/icons-material/Phone'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic'
import CloseIcon from '@mui/icons-material/Close'
import { COMPANY_INFO } from '../../constants/siteData'

const SCROLL_SHOW_POSITION = 300

// 본문(1360px) 양옆에 메뉴가 들어갈 여유가 있는 폭 (이보다 좁으면 상품 카드를 가리므로 접어 둠)
const WIDE_SCREEN_QUERY = '(min-width:1540px)'

// 아이콘 배경색: 카카오톡·채널톡·블로그는 각 서비스의 대표 색상, 전화·계좌는 사이트 색상
// hasPanel이 true인 메뉴는 누르면 안내 창이 열림
const CONSULT_MENUS = [
  { id: 'phone', label: '전화', bgcolor: '#F26A1B', color: '#fff', Icon: PhoneIcon, hasPanel: true },
  { id: 'kakao', label: '카카오톡', bgcolor: '#FEE500', color: '#3A1D1D', Icon: ChatBubbleIcon },
  { id: 'channel', label: '채널톡', bgcolor: '#3D5AFE', color: '#fff', Icon: SupportAgentIcon },
  { id: 'blog', label: '블로그', bgcolor: '#03C75A', color: '#fff', Icon: EditNoteIcon },
  { id: 'account', label: '계좌', bgcolor: '#111111', color: '#fff', Icon: AccountBalanceIcon, hasPanel: true },
]

// 화면 오른쪽에 고정되는 상담 배너 + 맨 위로 올라가기 버튼
// 넓은 화면: 항상 펼쳐져 있음 / 좁은 화면: 상담 버튼을 누르면 펼쳐져서 상품을 가리지 않음
const FloatingMenu = () => {
  const isWide = useMediaQuery(WIDE_SCREEN_QUERY)
  const [isTopButtonVisible, setIsTopButtonVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState({ id: null, anchorEl: null })
  const [isCopied, setIsCopied] = useState(false)

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handlePanelOpen = (id) => (event) => {
    setPanel({ id, anchorEl: event.currentTarget })
  }

  const handlePanelClose = () => {
    setPanel({ id: null, anchorEl: null })
  }

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(COMPANY_INFO.accountNumber)
      setIsCopied(true)
    } catch {
      // 복사 권한이 없는 환경: 번호가 화면에 그대로 보이므로 직접 선택해서 복사할 수 있음
    }
  }

  const handleSnackbarClose = () => {
    setIsCopied(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsTopButtonVisible(window.scrollY > SCROLL_SHOW_POSITION)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          right: isWide ? 20 : 10,
          bottom: isWide ? 'auto' : 16,
          top: isWide ? '50%' : 'auto',
          transform: isWide ? 'translateY(-50%)' : 'none',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            display: isWide || isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 1,
            p: 1,
            borderRadius: 8,
          }}
        >
          {CONSULT_MENUS.map(({ id, label, bgcolor, color, Icon, hasPanel }) => (
            <Box key={id} sx={{ textAlign: 'center' }}>
              <IconButton
                aria-label={hasPanel ? `${label} 안내 보기` : label}
                onClick={hasPanel ? handlePanelOpen(id) : undefined}
                sx={{
                  width: isWide ? 48 : 40,
                  height: isWide ? 48 : 40,
                  bgcolor,
                  color,
                  '&:hover': { bgcolor, filter: 'brightness(0.92)' },
                }}
              >
                <Icon />
              </IconButton>
              {isWide && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontSize: '0.6875rem', color: 'text.secondary' }}>
                  {label}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>

        {/* 좁은 화면 전용: 상담 메뉴 열기/닫기 */}
        {!isWide && (
          <IconButton
            aria-label={isOpen ? '상담 메뉴 닫기' : '상담 메뉴 열기'}
            onClick={handleToggle}
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'primary.main',
              color: '#fff',
              boxShadow: 3,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {isOpen ? <CloseIcon /> : <HeadsetMicIcon />}
          </IconButton>
        )}

        {/* 맨 위로 올라가기: 스크롤을 내렸을 때만 표시 */}
        <IconButton
          aria-label="맨 위로 올라가기"
          onClick={handleScrollTop}
          sx={{
            width: 44,
            height: 44,
            bgcolor: '#111',
            color: '#fff',
            boxShadow: 3,
            opacity: isTopButtonVisible ? 1 : 0,
            pointerEvents: isTopButtonVisible ? 'auto' : 'none',
            transition: 'opacity .2s',
            '&:hover': { bgcolor: 'primary.main' },
          }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      </Box>

      {/* 안내 창: 메뉴 왼쪽에 뜸 (전화 = 상담시간, 계좌 = 입금계좌 + 복사) */}
      <Popover
        open={Boolean(panel.anchorEl)}
        anchorEl={panel.anchorEl}
        onClose={handlePanelClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mr: 1.5, p: 2.5, borderRadius: 2, width: 300, maxWidth: 'calc(100vw - 90px)' } } }}
      >
        {panel.id === 'phone' && (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              대표전화
            </Typography>
            <Typography component="a" href="tel:16449879" sx={{ display: 'block', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}>
              {COMPANY_INFO.tel}
            </Typography>
            <Box sx={{ my: 1.5, py: 1.5, borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>상담시간 {COMPANY_INFO.hours}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                휴무 {COMPANY_INFO.holiday}
              </Typography>
            </Box>
            <Button component="a" href="tel:16449879" variant="contained" size="small" startIcon={<PhoneIcon />} fullWidth>
              전화 걸기
            </Button>
          </Box>
        )}

        {panel.id === 'account' && (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              입금계좌 안내
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.0625rem', mt: 0.5, whiteSpace: 'nowrap' }}>{COMPANY_INFO.bank}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              예금주 {COMPANY_INFO.accountHolder}
            </Typography>
            <Button variant="contained" size="small" startIcon={<ContentCopyIcon />} onClick={handleCopyAccount} fullWidth>
              계좌번호 복사
            </Button>
          </Box>
        )}
      </Popover>

      <Snackbar
        open={isCopied}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={handleSnackbarClose}>
          계좌번호가 복사되었습니다
        </Alert>
      </Snackbar>
    </>
  )
}

export default FloatingMenu
