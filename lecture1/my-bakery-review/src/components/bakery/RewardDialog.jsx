import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Illustration from '../common/decor/Illustration'
import Sparkle from '../common/decor/Sparkle'
import WoodButton from '../common/WoodButton'
import XpTrack from '../common/XpTrack'
import { useCountUp } from '../../hooks/useCountUp'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 모험 일지를 저장한 뒤 보여주는 보상 화면. "저장에 성공한 뒤"에만 열려요.
// 받은 EXP와 내역(리뷰 · 사진 · 퀘스트 완료)은 저장 전 / 후 상태를 비교한 실제 계산 결과예요.
// reward: { mode, diff, after }  /  onClose: 확인을 누르면 불려요 (레벨업이면 부모가 이어서 축하 창을 열어요)
const RewardDialog = ({ open, reward, onClose }) => {
  const gained = reward?.diff.expGained ?? 0
  const shownExp = useCountUp(gained, { duration: 900, active: open })
  const progress = reward?.after.progress

  return (
    <Dialog
      open={open && Boolean(reward)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: '24px', m: { xs: 1.5, sm: 4 }, overflow: 'visible' } } }}
    >
      {reward && (
        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3, overflow: 'visible' }}>
          <Box sx={{ position: 'relative', width: 'fit-content', mx: 'auto', mb: 1 }}>
            <Illustration name="knightCheer" width={150} className="float-soft" />
            <Sparkle size={26} twinkle sx={{ position: 'absolute', top: -4, left: -22 }} />
            <Sparkle size={18} twinkle delay={0.8} sx={{ position: 'absolute', top: 18, right: -24 }} />
            <Sparkle size={14} twinkle delay={1.5} sx={{ position: 'absolute', bottom: 6, left: -30 }} />
          </Box>

          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em', color: 'terracotta.main' }}>
            {reward.mode === 'create' ? 'LOG SAVED' : 'LOG UPDATED'}
          </Typography>
          <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.5rem', color: 'primary.main', mb: 1 }}>
            {reward.mode === 'create' ? '모험 일지를 남겼어요!' : '일지를 고쳐 적었어요!'}
          </Typography>

          {/* 받은 EXP */}
          <Box className="pop-in" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.75, mb: 1.5 }} aria-label={`EXP ${gained} 획득`}>
            <Typography component="span" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '2.6rem', lineHeight: 1, color: 'gold.dark' }}>
              +{shownExp}
            </Typography>
            <Typography component="span" sx={{ fontWeight: 800, color: 'gold.dark' }}>
              EXP
            </Typography>
          </Box>

          {/* 내역 */}
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {reward.diff.events.map((event) => (
              <Box
                component="li"
                key={event.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: RADIUS.md,
                  bgcolor: event.isQuest ? 'rgba(226,176,74,0.28)' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.875rem',
                }}
              >
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: event.isQuest ? 800 : 600, textAlign: 'left' }}>
                  {event.isQuest && <StarRoundedIcon sx={{ fontSize: '1rem', color: 'gold.dark' }} />}
                  {event.label}
                </Box>
                <Box component="span" sx={{ fontWeight: 800, color: 'primary.main', flexShrink: 0 }}>
                  +{event.exp}
                </Box>
              </Box>
            ))}
          </Box>

          {/* 현재 레벨 진행 */}
          <Box sx={{ textAlign: 'left', mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                Lv.{progress.currentIndex + 1} {progress.currentLevel.name}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'primary.main' }}>{progress.percent}%</Typography>
            </Box>
            <XpTrack percent={progress.percent} />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.75 }}>
              {progress.isMaxLevel
                ? `최고 레벨이에요! (누적 EXP ${progress.exp})`
                : `누적 EXP ${progress.exp} · 다음 레벨까지 EXP ${progress.expToNext} 남았어요`}
            </Typography>
          </Box>

          <WoodButton onClick={onClose}>{reward.diff.leveledUp ? '다음으로' : '확인'}</WoodButton>
        </DialogContent>
      )}
    </Dialog>
  )
}

export default RewardDialog
