import { Box } from '@mui/material';
import { useScrollProgress } from '../hooks/useScrollProgress';

function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <Box
      role="progressbar"
      aria-label="페이지 읽기 진행률"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: '100%',
        bgcolor: 'transparent',
        zIndex: (theme) => theme.zIndex.appBar + 1,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          bgcolor: 'primary.main',
          transformOrigin: 'left center',
          transform: `scaleX(${progress / 100})`,
          transition: 'transform 0.1s linear',
        }}
      />
    </Box>
  );
}

export default ScrollProgressBar;
