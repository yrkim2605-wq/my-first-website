import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useGameState } from '../../hooks/useGameState'
import { useDiscovery } from '../../hooks/useDiscovery'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 명예의 전당의 "내 기록": 이 브라우저에 저장된 내 모험 일지로 계산한 실제 값이에요.
// (아래 순위표는 예시 데이터예요. 서버가 없어서 다른 모험가의 기록은 이 브라우저에 없어요.)
const MyRecordCard = () => {
  const game = useGameState()
  const discovery = useDiscovery()
  const level = game.progress.currentLevel

  if (!game.profile) {
    return (
      <Box sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Typography sx={{ fontSize: '0.9rem', wordBreak: 'keep-all' }}>
          <b>내 기록</b> · 모험가를 만들고 일지를 남기면 여기에 내 기록이 나타나요.
        </Typography>
        <Button component={Link} to="/signup" variant="contained" size="small">
          새 모험가 만들기
        </Button>
      </Box>
    )
  }

  if (game.isLoading) {
    return (
      <Box role="status" sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 2, mb: 3 }}>
        <Typography sx={{ fontSize: '0.9rem' }}>
          <b>내 기록</b> · 불러오고 있어요…
        </Typography>
      </Box>
    )
  }

  if (game.loadError) {
    return (
      <Box role="alert" sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.9rem', wordBreak: 'keep-all' }}>
          <b>내 기록</b> · 불러오지 못했어요. {game.loadError} 서버에 저장된 기록은 그대로예요.
        </Typography>
        <Button onClick={game.reloadReviews} variant="contained" size="small">
          다시 시도
        </Button>
      </Box>
    )
  }

  return (
    <Box
      aria-label="내 기록"
      sx={{ ...PARCHMENT_SX, borderColor: 'gold.main', borderRadius: RADIUS.lg, p: { xs: 1.5, sm: 2 }, display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, mb: 3 }}
    >
      <Box sx={{ width: 56, height: 56, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
        <Box component="img" src={level.iconImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Box component="span" sx={{ px: 0.9, py: 0.1, borderRadius: RADIUS.pill, bgcolor: 'wood.main', color: 'gold.light', fontSize: '0.72rem', fontWeight: 800 }}>
            내 기록
          </Box>
          <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900 }} noWrap>
            {game.profile.nickname}
          </Typography>
          <Typography component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
            Lv.{game.progress.currentIndex + 1} {level.name}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mt: 0.25 }}>
          누적 EXP {game.exp} · 모험 일지 {game.stats.allReviewCount ?? game.stats.reviewCount}개 · 발견한 빵집 {discovery.discoveredCount}곳
        </Typography>
      </Box>
      <Button component={Link} to="/mypage" size="small" sx={{ flexShrink: 0 }}>
        상태창
      </Button>
    </Box>
  )
}

export default MyRecordCard
