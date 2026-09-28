import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from './SectionNav';
import useInView from '../../hooks/useInView';
import { dpx } from '../../constants/typography';
import { ABOUT_SECTIONS, aboutKoreanSx, aboutStageProps, aboutTextSx } from './aboutMeStyles';
import rainyPopo from '../../assets/rainy-popo.png';

// 02 My Story (시안: 자기소개-1.png)
// 화면에 들어오면 제목이 한 줄씩 올라오고, 타임라인 선이 왼쪽부터 그어지며 점이 차례로 켜진다.

const HEADING_LINES = ['FROM', 'NUTRITION', 'TO DESIGN'];

const TIMELINE_Y = 521;
const TIMELINE = [
  { x: 314, title: ['Food &', 'Nutrition'], detail: ['경남대', '식품영양학과 전공'], period: '2020~2024' },
  { x: 530, title: ['Olive Young'], detail: ['올리브영 근무'], period: '2024' },
  { x: 688, title: ['Nutritionist'], detail: ['영양사 근무'], period: '2025' },
  { x: 847, title: ['Web UI/UX'], detail: ['새로운 시작'], period: '2026 - Present' },
];

const TIMELINE_LINE_MS = 1100; // 선이 끝까지 그어지는 시간
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// 화면에 들어오기 전엔 아래로 살짝 내려가 숨어 있다가 delay(ms) 뒤에 올라온다
const revealSx = (isInView, delay) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'none' : `translateY(${dpx(24)})`,
  transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
});

const AboutStory = () => {
  const [ref, isInView] = useInView();
  const first = TIMELINE[0].x;
  const last = TIMELINE[TIMELINE.length - 1].x;

  return (
    <FitStage id={ABOUT_SECTIONS[1].id} ref={ref} {...aboutStageProps}>
      {/* 왼쪽 번호 + 세로 구분선 */}
      <Box sx={{ position: 'absolute', left: dpx(62), top: dpx(108) }}>
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(52), letterSpacing: '-0.02em' }}>02</Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(16), fontSize: dpx(22), letterSpacing: '-0.01em' }}>My Story</Typography>
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(237),
          top: dpx(95),
          height: dpx(617),
          width: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          transformOrigin: 'top',
          transform: isInView ? 'scaleY(1)' : 'scaleY(0)',
          transition: `transform 1.2s ${EASE}`,
          '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
        }}
      />

      {/* 큰 제목 */}
      <Typography
        component="h2"
        sx={{ ...aboutTextSx, position: 'absolute', left: dpx(300), top: dpx(132), fontSize: dpx(84), lineHeight: 1.02, letterSpacing: '-0.01em' }}
      >
        {HEADING_LINES.map((line, index) => (
          <Box key={line} component="span" sx={{ display: 'block', ...revealSx(isInView, 100 + index * 120) }}>
            {line}
          </Box>
        ))}
      </Typography>

      {/* 소개 문단 */}
      <Box sx={{ position: 'absolute', left: dpx(639), top: dpx(168), ...revealSx(isInView, 450) }}>
        <Typography sx={{ ...aboutKoreanSx, fontWeight: 400, fontSize: dpx(16), lineHeight: 1.32, color: '#a3a3a3' }}>
          사람들의 일상에 도움이 되는 정보를
          <br />
          더 쉽고 명확하게 표현하고 싶었습니다.
          <br />
          식품영양을 전공하고 영양사로 근무하며
          <br />
          시각적 표현의 힘을 경험했고,
          <br />그 관심은 웹과 UI/UX로 이어졌습니다.
        </Typography>
        <Typography
          sx={{ ...aboutTextSx, mt: dpx(32), fontWeight: 400, fontSize: dpx(14), lineHeight: 1.5, color: '#a3a3a3' }}
        >
          Different fields
          <br />
          same curiosity.
          <br />
          A deeper understanding
          <br />
          of people. For a better design.
        </Typography>
      </Box>

      {/* 타임라인 — 선이 왼쪽부터 그어지고, 선이 지나가는 순서대로 점과 글이 나타난다 */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(first),
          top: dpx(TIMELINE_Y),
          width: dpx(last - first),
          height: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.45)',
          transformOrigin: 'left',
          transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
          transition: `transform ${TIMELINE_LINE_MS}ms ${EASE} 500ms`,
          '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
        }}
      />
      <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {TIMELINE.map((item) => {
          // 선의 진행 비율에 맞춰 각 점이 켜지는 시점을 계산한다
          const delay = 500 + ((item.x - first) / (last - first)) * TIMELINE_LINE_MS * 0.7;
          return (
            <Stack
              key={item.period}
              component="li"
              sx={{
                position: 'absolute',
                left: dpx(item.x),
                top: dpx(TIMELINE_Y - 5),
                width: dpx(150),
                ml: dpx(-75),
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: dpx(9),
                  height: dpx(9),
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  transform: isInView ? 'scale(1)' : 'scale(0)',
                  transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
                  '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
                }}
              />
              <Box sx={revealSx(isInView, delay + 80)}>
                <Typography
                  component="h3"
                  sx={{ ...aboutTextSx, mt: dpx(18), height: dpx(60), fontSize: dpx(22), lineHeight: 1.36, letterSpacing: '-0.01em' }}
                >
                  {item.title.map((line) => (
                    <Box key={line} component="span" sx={{ display: 'block' }}>
                      {line}
                    </Box>
                  ))}
                </Typography>
                <Typography
                  sx={{ ...aboutKoreanSx, mt: dpx(6), height: dpx(30), fontWeight: 600, fontSize: dpx(12), lineHeight: 1.3, color: '#ffffff' }}
                >
                  {item.detail.map((line) => (
                    <Box key={line} component="span" sx={{ display: 'block' }}>
                      {line}
                    </Box>
                  ))}
                </Typography>
                <Typography
                  sx={{ ...aboutKoreanSx, mt: dpx(4), fontWeight: 600, fontSize: dpx(13), letterSpacing: 0, color: '#ffffff' }}
                >
                  {item.period}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>

      {/* 오른쪽 그림 — 마우스를 올리면 살짝 기울며 떠오른다 */}
      <Box
        component="img"
        src={rainyPopo}
        alt="RAINY — MY NAME IS POPO. 비 오는 날의 고양이 캐릭터 일러스트"
        sx={{
          position: 'absolute',
          left: dpx(978),
          top: dpx(258),
          width: dpx(338),
          height: dpx(367),
          objectFit: 'cover',
          ...revealSx(isInView, 350),
          '&:hover': { transform: `translateY(${dpx(-8)}) rotate(-1.5deg)` },
          transition: `opacity 0.8s ${EASE} 350ms, transform 0.5s ${EASE}`,
        }}
      />

      <SectionNav activeIndex={1} />
    </FitStage>
  );
};

export default AboutStory;
