import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from './SectionNav';
import useInView from '../../hooks/useInView';
import useIsMobile from '../../hooks/useIsMobile';
import { dpx, mpx } from '../../constants/typography';
import { aboutKoreanSx, aboutStageProps, aboutTextSx, mobileFlowSx, placeSx, sectionDividerSx } from './aboutMeStyles';

// 03 Certifications — 02 My Story와 같은 틀(왼쪽 번호·세로선·큰 제목)에 자격증 목록을 더한다
// 화면에 들어오면 제목이 한 줄씩 올라오고, 목록은 위에서부터 가로선이 그어지며 한 줄씩 나타난다.
// 모바일: 번호 → 제목 → 소개 → 목록 순서로 위에서 아래로 흐른다

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
  const [ref, isInView] = useInView(0.15);
  const isMobile = useIsMobile();
  const u = isMobile ? mpx : dpx;

  return (
    <FitStage id={id} ref={ref} {...aboutStageProps(isMobile)}>
      <Box sx={mobileFlowSx(isMobile)}>
        {/* 번호 + 구분선 */}
        <Box sx={placeSx(isMobile, { left: dpx(62), top: dpx(108) })}>
          <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(isMobile ? 40 : 52), letterSpacing: '-0.02em' }}>
            03
          </Typography>
          <Typography sx={{ ...aboutTextSx, mt: u(isMobile ? 10 : 16), fontSize: u(isMobile ? 18 : 22), letterSpacing: '-0.01em' }}>
            Certifications
          </Typography>
        </Box>
        <Box aria-hidden sx={sectionDividerSx(isMobile, isInView)} />

        {/* 큰 제목 */}
        <Typography
          component="h2"
          sx={{
            ...aboutTextSx,
            ...placeSx(isMobile, { left: dpx(300), top: dpx(132) }, { mt: mpx(28) }),
            fontSize: u(isMobile ? 60 : 84),
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
          }}
        >
          {HEADING_LINES.map((line, index) => (
            <Box key={line} component="span" sx={{ display: 'block', ...revealSx(isInView, 100 + index * 120) }}>
              {line}
            </Box>
          ))}
        </Typography>

        {/* 소개 문단 */}
        <Box sx={{ ...placeSx(isMobile, { left: dpx(300), top: dpx(360) }, { mt: mpx(24) }), ...revealSx(isInView, 400) }}>
          <Typography sx={{ ...aboutKoreanSx, fontWeight: 400, fontSize: u(isMobile ? 15 : 16), lineHeight: isMobile ? 1.6 : 1.5, color: '#a3a3a3' }}>
            매일 쓰는 디자인 툴의 실력을
            <br />
            공인 자격으로 검증받았습니다.
            <br />
            아이디어를 정확한 결과물로 옮기는
            <br />
            단단한 기본기가 되어 줍니다.
          </Typography>
          <Typography
            sx={{ ...aboutTextSx, mt: u(isMobile ? 20 : 32), fontWeight: 400, fontSize: u(14), lineHeight: 1.5, color: '#a3a3a3' }}
          >
            Ideas need solid hands.
            <br />
            Certified in the tools I use every day.
          </Typography>
        </Box>

        {/* 자격증 목록 — 위에서부터 한 줄씩 가로선이 그어지며 나타난다 */}
        <Box
          component="ol"
          sx={{
            // m을 먼저 두어야 뒤의 모바일 mt가 덮어쓰이지 않는다
            m: 0,
            ...placeSx(
              isMobile,
              { left: dpx(LIST_LEFT), top: dpx(LIST_TOP), width: dpx(LIST_WIDTH) },
              { mt: mpx(44) },
            ),
            p: 0,
            listStyle: 'none',
          }}
        >
          {CERTIFICATIONS.map((cert, index) => {
            const delay = 350 + index * 160;
            return (
              // 모바일은 이름이 두 줄로 넘어갈 수 있어 줄 높이를 고정하지 않는다
              <Box key={cert.code} component="li" sx={isMobile ? { pb: mpx(26) } : { height: dpx(ROW_HEIGHT) }}>
                <Box aria-hidden sx={hairlineSx(isInView, delay)} />
                <Stack direction="row" sx={{ pt: u(26), ...revealSx(isInView, delay + 120) }}>
                  <Box sx={{ width: u(isMobile ? 84 : 180), flexShrink: 0 }}>
                    <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(12), color: '#a3a3a3' }}>
                      {String(index + 1).padStart(2, '0')}
                    </Typography>
                    <Typography
                      component="h3"
                      sx={{ ...aboutTextSx, mt: u(8), fontSize: u(isMobile ? 40 : 56), letterSpacing: '-0.01em' }}
                    >
                      {cert.code}
                    </Typography>
                  </Box>
                  <Box sx={{ pt: u(18), minWidth: 0 }}>
                    <Typography sx={{ ...aboutTextSx, fontSize: u(isMobile ? 20 : 22), lineHeight: isMobile ? 1.1 : 1, letterSpacing: '-0.01em' }}>
                      {cert.name}
                    </Typography>
                    <Typography
                      sx={{ ...aboutKoreanSx, mt: u(8), fontWeight: 400, fontSize: u(13), lineHeight: 1.45, color: '#a3a3a3', wordBreak: 'keep-all' }}
                    >
                      {cert.detail}
                    </Typography>
                    <Stack direction="row" sx={{ mt: u(14), gap: u(6) }}>
                      {cert.tags.map((tag) => (
                        <Box
                          key={tag}
                          component="span"
                          sx={{
                            ...aboutKoreanSx,
                            px: u(10),
                            py: u(3),
                            border: '1px solid rgba(255, 255, 255, 0.45)',
                            borderRadius: u(999),
                            fontWeight: 600,
                            fontSize: u(11),
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
      </Box>

      <SectionNav activeIndex={sectionIndex} />
    </FitStage>
  );
};

export default AboutCertifications;
