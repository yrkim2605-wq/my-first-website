import { Box, Typography } from '@mui/material';
import { useInView } from '../hooks/useInView';
import { useCountUp } from '../hooks/useCountUp';

function StatCounter({ value, label, suffix = '' }) {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const displayValue = useCountUp(value, { start: inView, duration: 1400 });

  return (
    <Box ref={ref} sx={{ textAlign: 'center', minWidth: 120 }}>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: { xs: '2.2rem', md: '3rem' },
          color: 'primary.main',
          lineHeight: 1,
        }}
      >
        {displayValue}
        {suffix}
      </Typography>
      <Typography sx={{ color: 'text.secondary', mt: 1 }}>{label}</Typography>
    </Box>
  );
}

export default StatCounter;
