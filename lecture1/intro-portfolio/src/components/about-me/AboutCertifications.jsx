import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from './SectionNav';
import useInView from '../../hooks/useInView';
import { dpx } from '../../constants/typography';
import { aboutKoreanSx, aboutStageProps, aboutTextSx } from './aboutMeStyles';

// 03 Certifications — 02 My Story와 같은 틀(왼쪽 번호·세로선·큰 제목)에 자격증 목록을 더한다
// 화면에 들어오면 제목이 한 줄씩 올라오고, 목록은 위에서부터 가로선이 그어지며 한 줄씩 나타난다.

const HEADING_LINES = ['CERTIFIED', 'SKILLS'];

const CERTIFICATIONS = [
  {
    code: 'ACP',
    name: 'Adobe Certified Professional',
    detail: '어도비 공인 전문가 자격 · Adobe 발급',
    tags: ['Photoshop', 'Illustrator'],
  },
  {
    code: 'GTQ',
    name: 'Graphic Technology Qualification',
    detail: '그래픽기술자격 (포토샵) · 한국생산성본부 발급',
    tags: ['Photoshop', '1급'],
  },
  {
    code: 'GTQi',
    name: 'Graphic Technology Qualification — Illustrator',
    detail: '그래픽기술자격 일러스트 · 한국생산성본부 발급',
    tags: ['Illustrator', '1급'],
  },
];

const LIST_LEFT = 720;
const LIST_TOP = 150;
const LIST_WIDTH = 600;
const ROW_HEIGHT = 150;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// 화면에 들어오기 전엔 아래로 살짝 내려가 숨어 있다가 delay(ms) 뒤에 올라온다
const revealSx = (isInView, delay) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'none' : `translateY(${dpx(24)})`,
  transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
});

// 왼쪽부터 그어지는 가는 가로선
const hairlineSx = (isInView, delay) => ({
  height: '1px',
  bgcolor: 'rgba(255, 255, 255, 0.3)',
  transformOrigin: 'left',
  transform: isInView ? 'scaleX(1)' : 'scaleX(0)',
  transition: `transform 1s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
});

const AboutCertifications = ({ id, sectionIndex }) => {
  const [ref, isInView] = useInView();

  return (
    <FitStage id={id} ref={ref} {...aboutStageProps}>
      {/* 왼쪽 번호 + 세로 구분선 */}
      <Box sx={{ position: 'absolute', left: dpx(62), top: dpx(108) }}>
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(52), letterSpacing: '-0.02em' }}>03</Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(16), fontSize: dpx(22), letterSpacing: '-0.01em' }}>
          Certifications
        </Typography>
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
      <Box sx={{ position: 'absolute', left: dpx(300), top: dpx(360), ...revealSx(isInView, 400) }}>
        <Typography sx={{ ...aboutKoreanSx, fontWeight: 400, fontSize: dpx(16), lineHeight: 1.5, color: '#a3a3a3' }}>
          매일 쓰는 디자인 툴의 실력을
          <br />
          공인 자격으로 검증받았습니다.
          <br />
          아이디어를 정확한 결과물로 옮기는
          <br />
          단단한 기본기가 되어 줍니다.
        </Typography>
        <Typography
          sx={{ ...aboutTextSx, mt: dpx(32), fontWeight: 400, fontSize: dpx(14), lineHeight: 1.5, color: '#a3a3a3' }}
        >
          Ideas need solid hands.
          <br />
          Certified in the tools I use every day.
        </Typography>
      </Box>

      {/* 자격증 목록 — 위에서부터 한 줄씩 가로선이 그어지며 나타난다 */}
      <Box
        component="ol"
        sx={{ position: 'absolute', left: dpx(LIST_LEFT), top: dpx(LIST_TOP), width: dpx(LIST_WIDTH), m: 0, p: 0, listStyle: 'none' }}
      >
        {CERTIFICATIONS.map((cert, index) => {
          const delay = 350 + index * 160;
          return (
            <Box key={cert.code} component="li" sx={{ height: dpx(ROW_HEIGHT) }}>
              <Box aria-hidden sx={hairlineSx(isInView, delay)} />
              <Stack direction="row" sx={{ pt: dpx(26), ...revealSx(isInView, delay + 120) }}>
                <Box sx={{ width: dpx(180), flexShrink: 0 }}>
                  <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(12), color: '#a3a3a3' }}>
                    {String(index + 1).padStart(2, '0')}
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{ ...aboutTextSx, mt: dpx(8), fontSize: dpx(56), letterSpacing: '-0.01em' }}
                  >
                    {cert.code}
                  </Typography>
                </Box>
                <Box sx={{ pt: dpx(18) }}>
                  <Typography sx={{ ...aboutTextSx, fontSize: dpx(22), letterSpacing: '-0.01em' }}>
                    {cert.name}
                  </Typography>
                  <Typography sx={{ ...aboutKoreanSx, mt: dpx(8), fontWeight: 400, fontSize: dpx(13), color: '#a3a3a3' }}>
                    {cert.detail}
                  </Typography>
                  <Stack direction="row" sx={{ mt: dpx(14), gap: dpx(6) }}>
                    {cert.tags.map((tag) => (
                      <Box
                        key={tag}
                        component="span"
                        sx={{
                          ...aboutKoreanSx,
                          px: dpx(10),
                          py: dpx(3),
                          border: '1px solid rgba(255, 255, 255, 0.45)',
                          borderRadius: dpx(999),
                          fontWeight: 600,
                          fontSize: dpx(11),
                          letterSpacing: '0.02em',
                          lineHeight: 1.3,
                          color: '#ffffff',
                        }}
                      >
                        {tag}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          );
        })}
        <Box aria-hidden sx={hairlineSx(isInView, 350 + CERTIFICATIONS.length * 160)} />
      </Box>

      <SectionNav activeIndex={sectionIndex} />
    </FitStage>
  );
};

export default AboutCertifications;
