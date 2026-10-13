import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { INK, POINT_LIME } from '../constants/colors';

// 구직 상태 배지 — 라임 점이 숨 쉬듯 퍼지며 "지금 연락해도 된다"는 신호를 준다
// (퍼지는 고리 키프레임: index.css의 statusPulse)
const OpenToWork = ({ sx = {} }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      px: 1.5,
      py: 0.75,
      border: `1px solid ${INK}`,
      borderRadius: 999,
      bgcolor: '#ffffff',
      color: INK,
      ...sx,
    }}
  >
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: POINT_LIME,
        boxShadow: `inset 0 0 0 1px ${INK}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          bgcolor: POINT_LIME,
          '@media (prefers-reduced-motion: no-preference)': { animation: 'statusPulse 1.8s ease-out infinite' },
        },
      }}
    />
    <Typography
      sx={{ fontFamily: '"Alumni Sans", sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', lineHeight: 1 }}
    >
      OPEN TO WORK
    </Typography>
  </Box>
);

export default OpenToWork;
