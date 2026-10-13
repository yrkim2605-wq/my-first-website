import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Illustration from '../common/decor/Illustration'
import Sparkle from '../common/decor/Sparkle'
import WoodButton from '../common/WoodButton'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 레벨업 축하 모달: 빵 기사가 새 메달과 함께 축하해요.
// 실제로 레벨이 오른 순간(저장 전 / 후 레벨 비교)에만 열려요. 새로고침하면 다시 뜨지 않아요.
// levelUp: { level, index, expToNext, isMaxLevel }
const LevelUpDialog = ({ open, levelUp, onClose }) => (
  <Dialog
    open={open && Boolean(levelUp)}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: '26px', m: { xs: 1.5, sm: 4 }, overflow: 'visible' } } }}
  >
    {levelUp && (
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3.5, overflow: 'visible' }}>
        <Box sx={{ position: 'relative', width: 'fit-content', mx: 'auto' }}>
          <Illustration name="knightHero" width={190} className="float-soft" />
          <Sparkle size={32} twinkle sx={{ position: 'absolute', top: 0, left: -26 }} />
          <Sparkle size={20} twinkle delay={0.7} sx={{ position: 'absolute', top: 36, right: -28 }} />
          <Sparkle size={24} twinkle delay={1.4} sx={{ position: 'absolute', bottom: 26, left: -34 }} />
          <Sparkle size={16} twinkle delay={2} sx={{ position: 'absolute', bottom: 8, right: -20 }} />
        </Box>

        <Typography sx={{ mt: 1, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', color: 'terracotta.main' }}>
          LEVEL UP!
        </Typography>
        <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.7rem', color: 'primary.main', mb: 1.5, wordBreak: 'keep-all' }}>
          Lv.{levelUp.index + 1} {levelUp.level.name} 달성!
        </Typography>

        {/* 새 메달 */}
        <Box
          className="pop-in"
          sx={{
            width: 104,
            height: 104,
            mx: 'auto',
            mb: 1.5,
            display: 'grid',
            placeItems: 'center',
            borderRadius: RADIUS.round,
            bgcolor: 'parchment.light',
            border: '4px solid',
            borderColor: 'gold.main',
            boxShadow: '0 0 0 6px rgba(226,176,74,0.35)',
          }}
        >
          <Box
            component="img"
            src={levelUp.level.iconImage}
            alt={`${levelUp.level.name} 메달`}
            sx={{ width: '84%', height: '84%', objectFit: 'contain', transform: `scale(${levelUp.level.iconScale ?? 1})` }}
          />
        </Box>

        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 3, wordBreak: 'keep-all' }}>
          {levelUp.isMaxLevel
            ? '가장 높은 레벨에 도달했어요. 전설의 빵덕후가 되었네요!'
            : `새로운 칭호를 얻었어요. 다음 레벨까지 EXP ${levelUp.expToNext} 남았어요.`}
        </Typography>

        <WoodButton onClick={onClose}>계속 모험하기</WoodButton>
      </DialogContent>
    )}
  </Dialog>
)

export default LevelUpDialog
