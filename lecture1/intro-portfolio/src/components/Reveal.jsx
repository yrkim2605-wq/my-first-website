import Box from '@mui/material/Box';
import useInView from '../hooks/useInView';

// 화면에 들어오면 아래에서 살짝 떠오르며 나타난다 — 한 번만 재생된다
// delay: 지연(ms), distance: 떠오르는 거리, component: 감쌀 태그, threshold: 몇 %가 보이면 시작할지
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const Reveal = ({ children, delay = 0, distance = '20px', component = 'div', threshold = 0.3, sx = {}, ...props }) => {
  const [ref, isInView] = useInView(threshold);

  return (
    <Box
      ref={ref}
      component={component}
      sx={{
        opacity: isInView ? 1 : 0,
        translate: isInView ? '0 0' : `0 ${distance}`,
        transition: `opacity 0.8s ${EASE} ${delay}ms, translate 0.8s ${EASE} ${delay}ms`,
        '@media (prefers-reduced-motion: reduce)': { opacity: 1, translate: 'none', transition: 'none' },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default Reveal;
