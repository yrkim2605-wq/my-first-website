import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from '../about-me/SectionNav';
import BeforeAfterSlider from './BeforeAfterSlider';
import useInView from '../../hooks/useInView';
import useIsMobile from '../../hooks/useIsMobile';
import { dpx, mpx } from '../../constants/typography';
import { POINT_LIME } from '../../constants/colors';
import {
  aboutKoreanSx,
  aboutStageProps,
  aboutTextSx,
  mobileFlowSx,
  placeSx,
  sectionDividerSx,
} from '../about-me/aboutMeStyles';

// 프로젝트 상세 03 화면 — 기존 사이트와 리디자인을 손잡이로 밀어 비교한다 (1440 × 784 기준)
// 글·이미지는 project.compare(projectDetails.js)에서 받는다.
// 모바일: 번호 → 제목 → 설명 → 비교 창 → 사이트 버튼 순서로 흐른다

const FRAME = { left: 640, top: 64, width: 700, height: 660 };
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const revealSx = (isInView, delay) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'none' : `translateY(${dpx(24)})`,
  transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
});

const ProjectCompare = ({ project }) => {
  const [ref, isInView] = useInView(0.25);
  const isMobile = useIsMobile();
  const u = isMobile ? mpx : dpx;
  const { sections, compare } = project;
  const section = sections[2];

  return (
    <FitStage id={section.id} ref={ref} {...aboutStageProps(isMobile)}>
      <Box sx={mobileFlowSx(isMobile)}>
        {/* 번호 + 구분선 */}
        <Box sx={{ ...placeSx(isMobile, { left: dpx(62), top: dpx(108) }), ...revealSx(isInView, 0) }}>
          <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(isMobile ? 40 : 52), letterSpacing: '-0.02em' }}>
            {section.label}
          </Typography>
          <Typography sx={{ ...aboutTextSx, mt: u(isMobile ? 10 : 16), fontSize: u(isMobile ? 18 : 22), letterSpacing: '-0.01em' }}>
            {compare.label}
          </Typography>
        </Box>
        <Box aria-hidden sx={sectionDividerSx(isMobile, isInView)} />

        <Typography
          component="h2"
          sx={{
            ...aboutTextSx,
            ...placeSx(isMobile, { left: dpx(300), top: dpx(132) }, { mt: mpx(28) }),
            fontSize: u(isMobile ? 56 : 72),
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
          }}
        >
          {compare.heading.map((line, index) => (
            <Box key={line} component="span" sx={{ display: 'block', ...revealSx(isInView, 100 + index * 120) }}>
              {line}
            </Box>
          ))}
        </Typography>

        <Box sx={{ ...placeSx(isMobile, { left: dpx(300), top: dpx(312), width: dpx(290) }, { mt: mpx(20) }), ...revealSx(isInView, 380) }}>
          {compare.description.map((line) => (
            <Typography
              key={line}
              sx={{ ...aboutKoreanSx, fontWeight: 400, fontSize: u(14), lineHeight: 1.6, color: '#a3a3a3', wordBreak: 'keep-all' }}
            >
              {line}
            </Typography>
          ))}
          {/* 조작 안내 */}
          <Stack direction="row" sx={{ mt: u(20), gap: u(16), flexWrap: 'wrap' }}>
            {[
              ['↔', 'DRAG TO COMPARE'],
              ['↕', 'SCROLL INSIDE'],
            ].map(([icon, text]) => (
              <Typography key={text} sx={{ ...aboutTextSx, fontSize: u(13), letterSpacing: '0.08em' }}>
                <Box component="span" sx={{ mr: u(6), color: POINT_LIME }}>
                  {icon}
                </Box>
                {text}
              </Typography>
            ))}
          </Stack>
        </Box>

        {/* 비교 창 — 아래에서 위로 걷히듯 드러난다 */}
        <Box
          sx={{
            ...placeSx(
              isMobile,
              { left: dpx(FRAME.left), top: dpx(FRAME.top), width: dpx(FRAME.width), height: dpx(FRAME.height) },
              { mt: mpx(28), height: '72svh' },
            ),
            clipPath: isInView ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
            transition: `clip-path 1.2s ${EASE} 250ms`,
            '@media (prefers-reduced-motion: reduce)': { clipPath: 'none', transition: 'none' },
          }}
        >
          <BeforeAfterSlider before={compare.before} after={compare.after} isActive={isInView} sx={{ width: '100%', height: '100%' }} />
        </Box>

        {/* 실제 리디자인 사이트로 — 새 탭 */}
        <Box
          component="a"
          href={compare.site}
          target="_blank"
          rel="noreferrer"
          aria-label="Dr.Jart+ 리디자인 사이트 열기 (새 탭)"
          sx={{
            ...placeSx(isMobile, { left: dpx(300), top: dpx(560) }, { mt: mpx(28), alignSelf: 'flex-start' }),
            display: 'inline-flex',
            alignItems: 'center',
            gap: u(10),
            py: u(8),
            color: '#ffffff',
            textDecoration: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
            '& .visitArrow': { transition: `transform 0.3s ${EASE}` },
            '&:hover .visitArrow, &:focus-visible .visitArrow': { transform: 'translate(3px, -3px)' },
            ...revealSx(isInView, 520),
          }}
        >
          <Box aria-hidden sx={{ width: u(10), height: u(10), bgcolor: POINT_LIME }} />
          <Typography sx={{ ...aboutTextSx, fontSize: u(isMobile ? 17 : 18), letterSpacing: '0.04em' }}>VISIT SITE</Typography>
          <Box component="svg" className="visitArrow" viewBox="0 0 24 24" aria-hidden sx={{ width: u(18), height: u(18) }}>
            <path d="M5 19 L19 5 M8 5 H19 V16" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </Box>
        </Box>
      </Box>

      <SectionNav activeIndex={2} sections={sections} label="프로젝트 상세 섹션" />
    </FitStage>
  );
};

export default ProjectCompare;
