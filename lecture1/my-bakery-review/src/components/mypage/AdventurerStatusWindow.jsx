import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import XpProgressBar from '../common/XpProgressBar'
import Illustration from '../common/decor/Illustration'
import Sparkle from '../common/decor/Sparkle'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'
import { IS_ACCOUNT_MODE } from '../../lib/backend'

const StatTile = ({ label, value }) => (
  <Box sx={{ flex: '1 1 0', minWidth: 76, textAlign: 'center', px: 1, py: 1, borderRadius: RADIUS.md, bgcolor: 'rgba(255,255,255,0.55)', border: '1px solid rgba(201,165,106,0.6)' }}>
    <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.35rem', lineHeight: 1.2, color: 'primary.main' }}>{value}</Typography>
    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
  </Box>
)

// 모험가 상태창: 빵 기사 + (레벨 메달 + 닉네임) · 칭호 + 경험치 바 + 기록 요약.
// 모두 저장된 모험 일지에서 계산한 실제 값이에요 (game: useGameState의 결과).
const AdventurerStatusWindow = ({ game, discoveredCount, onOpenLevelBook }) => {
  const { profile, progress, stats, quests } = game
  const level = progress.currentLevel
  const completedQuests = quests.filter((quest) => quest.done).length

  return (
    <Box component="section" aria-label="모험가 상태창" sx={{ ...PARCHMENT_SX, borderRadius: '24px', overflow: 'hidden', mb: 6 }}>
      {/* 제목 띠 */}
      <Box sx={{ ...WOOD_PLANK_SX, borderRadius: 0, border: 'none', borderBottom: '3px solid #3e2713', px: 2.5, py: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', color: 'gold.light' }}>STATUS</Typography>
        <Button
          onClick={onOpenLevelBook}
          size="small"
          startIcon={<MenuBookIcon />}
          sx={{ color: 'parchment.light', borderRadius: RADIUS.pill, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
        >
          레벨북
        </Button>
      </Box>

      <Box sx={{ p: { xs: 2.5, sm: 3.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, gap: { xs: 2, sm: 4 }, alignItems: 'center' }}>
        {/* 빵 기사 (레벨 메달은 닉네임 앞으로 옮겼어요: 캐릭터와 겹치지 않게) */}
        <Box sx={{ position: 'relative', width: 'fit-content', mx: { xs: 'auto', sm: 0 } }}>
          <Illustration name="knightHero" width={{ xs: 150, sm: 190 }} className="float-soft" eager />
          <Sparkle size={22} twinkle sx={{ position: 'absolute', top: 6, left: -10 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: 'terracotta.dark' }}>
            Lv.{progress.currentIndex + 1} {level.name}
          </Typography>
          {/* 레벨 메달 + 닉네임: 메달이 닉네임 바로 앞에 와요 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                borderRadius: RADIUS.round,
                bgcolor: 'parchment.light',
                border: '3px solid',
                borderColor: 'gold.main',
                boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
              }}
            >
              <Box component="img" src={level.iconImage} alt={`${level.name} 메달`} sx={{ width: '82%', height: '82%', objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }} />
            </Box>
            <Typography component="h2" sx={{ minWidth: 0, fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.6rem', sm: '1.9rem' }, lineHeight: 1.3, color: 'text.primary', wordBreak: 'break-all' }}>
              {profile.nickname}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 2 }}>
            {profile.createdAt.slice(0, 10)} 모험 시작 · {IS_ACCOUNT_MODE ? '내 계정에 저장된 프로필' : '이 브라우저에 저장된 임시 프로필'}
          </Typography>

          <XpProgressBar
            levelName={level.name}
            nextLevelName={progress.nextLevel?.name}
            percent={progress.percent}
            exp={progress.exp}
            expToNext={progress.expToNext}
            isMaxLevel={progress.isMaxLevel}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <StatTile label="모험 일지" value={stats.allReviewCount ?? stats.reviewCount} />
            <StatTile label="발견한 빵집" value={discoveredCount} />
            <StatTile label="완료한 퀘스트" value={`${completedQuests}/${quests.length}`} />
            <StatTile label="누적 EXP" value={progress.exp} />
          </Box>

          <Typography sx={{ mt: 1.75, fontSize: '0.8rem', color: 'text.secondary' }}>
            예정 혜택 (아직 제공되지 않아요) · {level.perk}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default AdventurerStatusWindow
