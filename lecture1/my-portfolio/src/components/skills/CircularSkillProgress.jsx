import { Box, Typography } from '@mui/material';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

const SIZE = 96;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularSkillProgress({ name, level, color }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const displayLevel = useCountUp(level, { start: inView, duration: 1400 });
  const offset = CIRCUMFERENCE * (1 - (inView ? level : 0) / 100);

  return (
    <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeOpacity={0.15}
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 800, color }}>{displayLevel}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</Typography>
    </Box>
  );
}

export default CircularSkillProgress;
