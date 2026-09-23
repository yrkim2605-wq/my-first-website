import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const spinReverse = keyframes`
  to { transform: rotate(-360deg); }
`;

function LoadingSpinner({ size = 56 }) {
  return (
    <Box
      role="status"
      aria-label="로딩 중"
      sx={{ position: 'relative', width: size, height: size, display: 'inline-block' }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '4px solid',
          borderColor: 'primary.main',
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          animation: `${spin} 1s linear infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: `${size * 0.18}px`,
          borderRadius: '50%',
          border: '3px solid',
          borderColor: 'primary.light',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          animation: `${spinReverse} 0.8s linear infinite`,
        }}
      />
    </Box>
  );
}

export default LoadingSpinner;
