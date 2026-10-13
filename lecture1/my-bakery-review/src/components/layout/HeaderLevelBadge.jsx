import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Button from '@mui/material/Button'
import { NavLink } from 'react-router-dom'
import { MOCK_USER } from '../../constants/userProfile'
import { LEVELS } from '../../constants/levels'
import { getLevelProgress } from '../../utils/levelUtils'
import XpTrack from '../common/XpTrack'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

const Medal = ({ level, size }) =>
  level.iconImage ? (
    <Box
      component="img"
      src={level.iconImage}
      alt=""
      sx={{ width: size, height: size, flexShrink: 0, objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }}
    />
  ) : (
    <Box component="span" sx={{ fontSize: size * 0.6 }}>
      {level.emoji}
    </Box>
  )

// 다음 레벨까지 남은 양을 "방문 8곳 · 하트 20개"처럼 (이미 채운 항목은 빼고) 만들어요
const describeRemaining = ({ visitsNeeded, heartsNeeded }) =>
  [visitsNeeded > 0 && `방문 ${visitsNeeded}곳`, heartsNeeded > 0 && `하트 ${heartsNeeded}개`].filter(Boolean).join(' · ')

// 헤더 오른쪽의 레벨 칩: 누르면(모바일은 탭) 레벨업 방법과 내 진행 상황을 보여주는 작은 안내창이 열려요
// 안내창은 모달이 아니라 헤더 안에 붙는 Popper예요.
// - 페이지 스크롤을 막지 않고 (body에 padding · overflow를 걸지 않아 화면이 밀리지 않아요)
// - 헤더와 함께 움직여서 스크롤해도 복제되거나 엉뚱한 곳에 남지 않고
// - 화면 가장자리에서 16px 안쪽으로 밀어 넣어 잘리지 않아요.
// 열고 닫기
// - 마우스: 올리면 열리고, 벗어나면 닫혀요. 올린 채 클릭하면 "고정"돼서 벗어나도 유지되고, 다시 클릭하면 닫혀요.
// - 터치(모바일): 탭하면 열리고, 다시 탭하면 닫혀요.
// - 바깥을 누르거나 Esc를 눌러도 닫혀요.
const HOVER_CLOSE_DELAY = 180

const HeaderLevelBadge = () => {
  // 안내창이 붙을 버튼 (ref 콜백으로 상태에 담아요)
  const [anchorEl, setAnchorEl] = useState(null)
  const closeTimerRef = useRef(null)
  const pinnedRef = useRef(false) // 클릭으로 고정된 상태인지 (고정되면 마우스가 벗어나도 안 닫혀요)
  const [open, setOpen] = useState(false)
  const progress = getLevelProgress(MOCK_USER.visitedBakeryIds.length, MOCK_USER.totalHearts)
  const { currentLevel, nextLevel } = progress
  const levelNumber = LEVELS.findIndex((level) => level.id === currentLevel.id) + 1

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  useEffect(() => clearCloseTimer, [])

  // 마우스(펜 제외 터치)일 때만 호버로 열어요. 터치 기기는 탭으로만 열고 닫아요.
  const handlePointerEnter = (event) => {
    if (event.pointerType !== 'mouse') return
    clearCloseTimer()
    setOpen(true)
  }
  const handlePointerLeave = (event) => {
    if (event.pointerType !== 'mouse' || pinnedRef.current) return
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY)
  }
  const handleClose = () => {
    clearCloseTimer()
    pinnedRef.current = false
    setOpen(false)
  }
  const handleClick = () => {
    clearCloseTimer()
    if (open && !pinnedRef.current) {
      pinnedRef.current = true // 호버로 열려 있던 안내창을 고정
    } else if (open) {
      handleClose()
    } else {
      pinnedRef.current = true
      setOpen(true)
    }
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
    <Box
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={(event) => event.key === 'Escape' && handleClose()}
      sx={{ position: 'relative' }}
    >
      <Box
        ref={setAnchorEl}
        component="button"
        type="button"
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`내 레벨 ${currentLevel.name}, 다음 레벨까지 ${progress.percent}%. 레벨업 방법 보기`}
        title="레벨업 방법 보기"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          pl: 0.5,
          pr: { xs: 1.25, sm: 1.75 },
          py: 0.5,
          ...WOOD_PLANK_SX,
          borderRadius: RADIUS.pill,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: 'inset 0 2px 0 rgba(255,220,160,0.25), 0 3px 0 rgba(33,20,10,0.35)' },
          '&:active': { transform: 'translateY(1px)', boxShadow: 'inset 0 2px 0 rgba(255,220,160,0.25), 0 1px 0 rgba(33,20,10,0.35)' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        {/* 메달은 밝은 원 위에 올려요 (어두운 나무 위에서도 잘 보이게) */}
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            borderRadius: RADIUS.round,
            bgcolor: 'parchment.light',
            border: '2px solid',
            borderColor: 'gold.main',
          }}
        >
          <Medal level={currentLevel} size={32} />
        </Box>
        <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>
          <Box component="span" sx={{ color: 'gold.light', fontWeight: 800, mr: 0.6 }}>
            Lv.{levelNumber}
          </Box>
          {currentLevel.name}
        </Typography>
        <XpTrack aria-hidden="true" size="sm" percent={progress.percent} sx={{ display: { xs: 'none', md: 'block' }, width: 56 }} />
        <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'gold.light' }}>
          {progress.percent}%
        </Typography>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        transition
        disablePortal
        modifiers={[
          { name: 'offset', options: { offset: [0, 10] } },
          { name: 'preventOverflow', options: { padding: 16, altAxis: true } },
          { name: 'flip', enabled: false },
        ]}
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Box
              role="dialog"
              aria-label="레벨업 안내"
              sx={{
                width: 300,
                maxWidth: 'calc(100vw - 32px)',
                maxHeight: 'calc(100vh - 110px)',
                overflowY: 'auto',
                p: 2.25,
                ...PARCHMENT_SX,
                borderRadius: RADIUS.lg,
              }}
            >
        <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.05rem', color: 'primary.main', mb: 0.75 }}>
          레벨업 하는 법
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.6, mb: 1.75 }}>
          빵집을 방문하고 하트를 모으면 레벨이 올라가요. 방문한 빵집 수와 하트 수가 <b>모두</b> 다음 레벨 기준을 넘어야 해요.
        </Typography>

        {/* 내 진행 상황 */}
        <Box sx={{ bgcolor: 'butter.main', borderRadius: RADIUS.md, p: 1.5, mb: 1.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {currentLevel.name}
              {nextLevel && (
                <Box component="span" sx={{ fontWeight: 500, color: 'butter.contrastText' }}>
                  {' '}→ {nextLevel.name}
                </Box>
              )}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: 'primary.main' }}>{progress.percent}%</Typography>
          </Box>
          <XpTrack size="sm" percent={progress.percent} />
          <Typography sx={{ fontSize: '0.75rem', color: 'butter.contrastText', mt: 0.75 }}>
            {progress.isMaxLevel ? '최고 레벨이에요!' : `다음 레벨까지 ${describeRemaining(progress)} 더 필요해요`}
          </Typography>
        </Box>

        {/* 레벨별 기준 (levels.js의 실제 값) */}
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mb: 1.75 }}>
          {LEVELS.map((level) => {
            const isCurrent = level.id === currentLevel.id
            const criteria =
              level.minVisits === 0 && level.minHearts === 0
                ? '시작 레벨'
                : [`방문 ${level.minVisits}곳`, level.minHearts > 0 && `하트 ${level.minHearts}개`].filter(Boolean).join(' · ')
            return (
              <Box
                component="li"
                key={level.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  px: 0.75,
                  borderRadius: RADIUS.sm,
                  bgcolor: isCurrent ? 'rgba(123,45,59,0.07)' : 'transparent',
                }}
              >
                <Medal level={level} size={24} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: isCurrent ? 800 : 600, flex: 1 }}>{level.name}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{criteria}</Typography>
              </Box>
            )
          })}
        </Box>

        <Button
          component={NavLink}
          to="/mypage"
          onClick={handleClose}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ borderRadius: RADIUS.pill, fontWeight: 700 }}
        >
          마이페이지에서 내 레벨 보기
        </Button>
            </Box>
          </Fade>
        )}
      </Popper>
    </Box>
    </ClickAwayListener>
  )
}

export default HeaderLevelBadge
