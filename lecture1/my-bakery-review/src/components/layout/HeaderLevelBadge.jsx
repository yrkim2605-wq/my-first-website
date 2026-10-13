import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Popover from '@mui/material/Popover'
import Button from '@mui/material/Button'
import { NavLink } from 'react-router-dom'
import { MOCK_USER } from '../../constants/userProfile'
import { LEVELS } from '../../constants/levels'
import { getLevelProgress } from '../../utils/levelUtils'
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
const HeaderLevelBadge = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const progress = getLevelProgress(MOCK_USER.visitedBakeryIds.length, MOCK_USER.totalHearts)
  const { currentLevel, nextLevel } = progress
  const open = Boolean(anchorEl)

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`내 레벨 ${currentLevel.name}, 다음 레벨까지 ${progress.percent}%. 레벨업 방법 보기`}
        title="레벨업 방법 보기"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          pl: 0.5,
          pr: { xs: 1, sm: 1.5 },
          py: 0.5,
          border: 'none',
          borderRadius: RADIUS.pill,
          bgcolor: 'butter.main',
          color: 'butter.contrastText',
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'filter 0.15s ease',
          '&:hover': { filter: 'brightness(0.96)' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Medal level={currentLevel} size={38} />
        </Box>
        <Typography component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>
          {currentLevel.name}
        </Typography>
        <Box
          aria-hidden="true"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 48,
            height: 5,
            borderRadius: RADIUS.pill,
            bgcolor: 'rgba(110,69,24,0.18)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ width: `${progress.percent}%`, height: '100%', bgcolor: 'primary.main', borderRadius: RADIUS.pill }} />
        </Box>
        <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
          {progress.percent}%
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': '레벨업 안내',
            sx: {
              mt: 1,
              width: 300,
              maxWidth: 'calc(100vw - 32px)',
              p: 2.25,
              bgcolor: 'background.paper',
              borderRadius: RADIUS.lg,
              boxShadow: '0 14px 36px rgba(59,42,34,0.18)',
            },
          },
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
          <Box sx={{ height: 6, borderRadius: RADIUS.pill, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box sx={{ width: `${progress.percent}%`, height: '100%', bgcolor: 'primary.main', borderRadius: RADIUS.pill }} />
          </Box>
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
          onClick={() => setAnchorEl(null)}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ borderRadius: RADIUS.pill, fontWeight: 700 }}
        >
          마이페이지에서 내 레벨 보기
        </Button>
      </Popover>
    </>
  )
}

export default HeaderLevelBadge
