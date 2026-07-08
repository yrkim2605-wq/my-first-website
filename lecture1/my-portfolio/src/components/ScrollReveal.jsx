import { Box } from '@mui/material';
import { useInView } from '../hooks/useInView';

const DIRECTION_OFFSETS = {
  up: 'translate3d(0, 28px, 0)',
  down: 'translate3d(0, -28px, 0)',
  left: 'translate3d(28px, 0, 0)',
  right: 'translate3d(-28px, 0, 0)',
  none: 'translate3d(0, 0, 0)',
};

function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  component = 'div',
  sx,
  ...rest
}) {
  const [ref, inView] = useInView({ threshold });

  return (
    <Box
      ref={ref}
      component={component}
      sx={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0, 0, 0)' : DIRECTION_OFFSETS[direction],
        transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        willChange: 'opacity, transform',
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

export default ScrollReveal;
