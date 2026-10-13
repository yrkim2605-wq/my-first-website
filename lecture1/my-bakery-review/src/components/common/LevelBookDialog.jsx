import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { LEVELS } from '../../constants/levels'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { RADIUS } from '../../theme'

const formatLevelCondition = (level) => (level.minExp === 0 ? '시작 레벨' : `누적 EXP ${level.minExp} 이상`)

const LevelBookDialog = ({ open, onClose, currentLevelId }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: '22px' } } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MenuBookIcon sx={{ color: 'primary.main' }} />
        레벨북
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {LEVELS.map((level, index) => (
            <Box
              key={level.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                p: 1.5,
                borderRadius: RADIUS.md,
                border: '2px solid',
                borderColor: level.id === currentLevelId ? 'gold.main' : 'rgba(201,165,106,0.6)',
                bgcolor: level.id === currentLevelId ? 'rgba(226,176,74,0.22)' : 'rgba(255,255,255,0.5)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <Avatar variant="square" src={level.iconImage} sx={{ width: 54, height: 54, bgcolor: 'transparent', overflow: 'visible', '& img': { objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` } }}>
                  {level.emoji}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {index + 1}. {level.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    예정 혜택 · {level.perk}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'right', flexShrink: 0 }}
              >
                {formatLevelCondition(level)}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LevelBookDialog
