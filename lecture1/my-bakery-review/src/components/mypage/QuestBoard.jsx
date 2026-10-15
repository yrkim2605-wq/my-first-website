import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import XpTrack from '../common/XpTrack'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 퀘스트 보드: 나무 판자 위에 퀘스트 메모가 붙어 있어요.
// 진행 상황(n/목표)과 완료 여부는 저장된 모험 일지로 계산한 값이에요. 보너스 EXP는 완료했을 때 실제로 반영돼요.
const QuestBoard = ({ quests }) => (
  <Box component="section" aria-label="퀘스트 보드" sx={{ ...WOOD_PLANK_SX, borderRadius: '24px', p: { xs: 2, sm: 3 }, mb: 6 }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 2, px: 0.5 }}>
      <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: 'parchment.light' }}>
        퀘스트 보드
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'gold.light' }}>
        {quests.filter((quest) => quest.done).length}/{quests.length} 완료
      </Typography>
    </Box>

    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      {quests.map((quest) => (
        <Box
          component="li"
          key={quest.id}
          sx={{
            ...PARCHMENT_SX,
            position: 'relative',
            borderRadius: RADIUS.lg,
            p: 2,
            pt: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            ...(quest.done && { borderColor: 'gold.main', bgcolor: 'rgba(249,237,203,1)' }),
          }}
        >
          {/* 압정 */}
          <Box aria-hidden="true" sx={{ position: 'absolute', top: -7, left: '50%', width: 14, height: 14, ml: '-7px', borderRadius: RADIUS.round, bgcolor: quest.done ? 'gold.main' : 'terracotta.main', border: '2px solid #3e2713', boxShadow: '0 2px 0 rgba(33,20,10,0.4)' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography sx={{ fontWeight: 900, fontFamily: DISPLAY_FONT, fontSize: '1.05rem', color: 'primary.main' }}>{quest.title}</Typography>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.3,
                px: 1,
                py: 0.15,
                borderRadius: RADIUS.pill,
                fontSize: '0.72rem',
                fontWeight: 800,
                flexShrink: 0,
                ...(quest.done ? { bgcolor: 'gold.main', color: 'wood.dark' } : { bgcolor: 'rgba(143,166,126,0.25)', color: 'secondary.contrastText' }),
              }}
            >
              {quest.done && <StarRoundedIcon sx={{ fontSize: '0.9rem' }} />}
              {quest.done ? '완료' : '진행 중'}
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', wordBreak: 'keep-all' }}>{quest.description}</Typography>

          <Box sx={{ mt: 'auto', pt: 0.5 }}>
            <XpTrack
              size="sm"
              percent={quest.percent}
              role="progressbar"
              aria-valuenow={quest.current}
              aria-valuemin={0}
              aria-valuemax={quest.target}
              aria-label={`${quest.title} 진행도`}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, fontSize: '0.78rem', fontWeight: 700 }}>
              <span>
                {quest.current}/{quest.target}
                {quest.unit}
              </span>
              <Box component="span" sx={{ color: quest.done ? 'gold.text' : 'primary.main' }}>
                {quest.done ? `보너스 EXP +${quest.bonusExp} 받음` : `완료하면 EXP +${quest.bonusExp}`}
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

export default QuestBoard
