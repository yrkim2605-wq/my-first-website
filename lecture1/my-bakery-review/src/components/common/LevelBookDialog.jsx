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

const formatLevelCondition = (level) => {
  if (level.minVisits === 0 && level.minHearts === 0) return '가입 시 기본 지급'
  const parts = []
  if (level.minVisits > 0) parts.push(`방문 ${level.minVisits}회`)
  if (level.minHearts > 0) parts.push(`하트 ${level.minHearts}개`)
  return `${parts.join(' · ')} 이상`
}

const LevelBookDialog = ({ open, onClose, currentLevelId }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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
                borderRadius: 2,
                border: '1px solid rgba(46,42,37,0.08)',
                bgcolor: level.id === currentLevelId ? 'rgba(32,90,65,0.06)' : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                <Avatar variant="rounded" src={level.iconImage} sx={{ width: 40, height: 38, borderRadius: '10px' }}>
                  {level.emoji}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {index + 1}. {level.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {level.perk}
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
