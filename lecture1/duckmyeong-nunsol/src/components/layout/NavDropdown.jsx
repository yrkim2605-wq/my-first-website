import { useRef, useState } from 'react'
import { Box, Button, Paper } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

const CLOSE_DELAY_MS = 120

// 검정 메뉴 바의 드롭다운: 마우스를 올리면 열리고, 클릭·키보드(Enter, Esc)로도 쓸 수 있음
// children은 (close) => 패널 내용 형태의 함수 (항목을 고르면 close로 닫음)
const NavDropdown = ({ label, startIcon, buttonSx, panelSx, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeTimer = useRef(null)
  const buttonRef = useRef(null)

  const open = () => {
    clearTimeout(closeTimer.current)
    setIsOpen(true)
  }

  // 버튼에서 패널로 마우스를 옮기는 동안 깜빡 닫히지 않도록 잠깐 기다림
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS)
  }

  // 대기 중인 타이머가 있어도 어차피 같은 닫기 동작이라 따로 지우지 않아도 됨
  const close = () => setIsOpen(false)

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      close()
      buttonRef.current?.focus()
    }
  }

  // Tab으로 메뉴 밖으로 나가면 닫음
  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close()
  }

  return (
    <Box
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
    >
      <Button
        ref={buttonRef}
        color="inherit"
        startIcon={startIcon}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{ fontSize: 18, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
          />
        }
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        sx={{ px: 0, minWidth: 0, fontWeight: 500, height: '100%', borderRadius: 0, ...buttonSx }}
      >
        {label}
      </Button>
      {isOpen && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1300,
            color: 'text.primary',
            borderRadius: '0 0 8px 8px',
            minWidth: 180,
            ...panelSx,
          }}
        >
          {children(close)}
        </Paper>
      )}
    </Box>
  )
}

export default NavDropdown
