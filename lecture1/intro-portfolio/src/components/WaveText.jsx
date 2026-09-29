import Box from '@mui/material/Box';
import useInView from '../hooks/useInView';

// 글자가 아래에서 하나씩 물결처럼 떠오르며 나타난다 — 화면에 들어오면 한 번만 재생된다
// text: 보여줄 문장 (단어 단위로 줄바꿈되고, 단어 안 글자는 함께 붙어 움직인다)
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const WaveText = ({ text, component = 'span', charDelay = 22, startDelay = 0, threshold = 0.5, sx = {}, ...props }) => {
  const [ref, isInView] = useInView(threshold);
  const words = text.split(' ');
  let charIndex = -1;

  return (
    <Box component={component} ref={ref} aria-label={text} sx={{ display: 'inline', ...sx }} {...props}>
      {words.flatMap((word, wi) => {
        const wordNode = (
          <Box key={`w${wi}`} component="span" sx={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((char, ci) => {
              charIndex += 1;
              const delay = startDelay + charIndex * charDelay;
              return (
                <Box
                  key={ci}
                  component="span"
                  aria-hidden
                  sx={{
                    display: 'inline-block',
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? 'none' : 'translateY(0.6em) rotate(6deg)',
                    transition: `opacity 0.5s ${EASE} ${delay}ms, transform 0.6s ${EASE} ${delay}ms`,
                    '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
                  }}
                >
                  {char}
                </Box>
              );
            })}
          </Box>
        );
        // 단어 사이 공백은 별도 텍스트 노드로 둬서, 줄이 길어지면 이 자리에서 자연스럽게 줄바꿈된다
        return wi < words.length - 1 ? [wordNode, ' '] : [wordNode];
      })}
    </Box>
  );
};

export default WaveText;
