import { useEffect, useState } from 'react'
import { Box, IconButton, Paper, Typography, useMediaQuery } from '@mui/material'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import EditNoteIcon from '@mui/icons-material/EditNote'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic'
import CloseIcon from '@mui/icons-material/Close'

import { CONTACT_BAR_HEIGHT } from '../../constants/layout'

const SCROLL_SHOW_POSITION = 300

// 본문(1200px) 양옆에 메뉴가 들어갈 여유가 있는 폭 (이보다 좁으면 상품 카드를 가리므로 접어 둠)
const WIDE_SCREEN_QUERY = '(min-width:1380px)'

// 아이콘 배경색은 각 서비스의 대표 색상을 따름
const CONSULT_MENUS = [
  { id: 'kakao', label: '카카오톡', bgcolor: '#FEE500', color: '#3A1D1D', Icon: ChatBubbleIcon },
  { id: 'channel', label: '채널톡', bgcolor: '#3D5AFE', color: '#fff', Icon: SupportAgentIcon },
  { id: 'blog', label: '블로그', bgcolor: '#03C75A', color: '#fff', Icon: EditNoteIcon },
]

// 화면 오른쪽에 고정되는 상담 배너 + 맨 위로 올라가기 버튼
// 넓은 화면: 항상 펼쳐져 있음 / 좁은 화면: 상담 버튼을 누르면 펼쳐져서 상품을 가리지 않음
const FloatingMenu = () => {
  const isWide = useMediaQuery(WIDE_SCREEN_QUERY)
  const [isTopButtonVisible, setIsTopButtonVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
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
    <Box
      sx={{
        position: 'fixed',
        right: isWide ? 20 : 10,
        bottom: isWide ? 'auto' : CONTACT_BAR_HEIGHT + 16,
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
        {CONSULT_MENUS.map(({ id, label, bgcolor, color, Icon }) => (
          <Box key={id} sx={{ textAlign: 'center' }}>
            <IconButton
              aria-label={label}
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
  )
}

export default FloatingMenu
