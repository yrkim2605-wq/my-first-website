import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from '../about-me/SectionNav';
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

// 프로젝트 상세 02 화면 — 케이스 스터디: 기존 사이트의 문제 → 개선 방향, 메인 페이지 구조 변화 (1440 × 784 기준)
// 화면에 들어오면 제목이 올라오고, 오른쪽 목록은 위에서부터 가로선이 그어지며 한 줄씩 나타난다.
// 글은 project.caseStudy(projectDetails.js)에서 받는다.
// 모바일: 번호 → 제목 → 소개 → 문제 → 개선 방향 → 구조 변화 순서로 위에서 아래로 흐른다

const LIST = { left: 720, width: 620, top: 96 };
const ROW_HEIGHT = 86; // 목록 한 줄 높이 (데스크톱)
const GROUP_GAP = 26; // PROBLEM 묶음과 DIRECTION 묶음 사이
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MUTED = '#a3a3a3';

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

// 문제·개선 방향 한 묶음 — 이름표(PROBLEM / DIRECTION) + 번호 붙은 줄들
// accent: 개선 방향은 라임 점으로 "해결"을 표시한다
const PointGroup = ({ label, items, isInView, startDelay, accent = false, u, isMobile }) => (
  <Box>
    <Stack direction="row" sx={{ alignItems: 'center', gap: u(8), mb: u(10), ...revealSx(isInView, startDelay) }}>
      <Box
        aria-hidden
        sx={{
          width: u(7),
          height: u(7),
          bgcolor: accent ? POINT_LIME : 'transparent',
          border: accent ? 'none' : '1px solid rgba(255, 255, 255, 0.7)',
        }}
      />
      <Typography sx={{ ...aboutTextSx, fontSize: u(13), letterSpacing: '0.12em', color: accent ? '#ffffff' : MUTED }}>
        {label}
      </Typography>
    </Stack>
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {items.map((item, index) => {
        const delay = startDelay + 120 + index * 140;
        return (
          <Box key={item.title} component="li" sx={isMobile ? { pb: mpx(18) } : { height: dpx(ROW_HEIGHT) }}>
            <Box aria-hidden sx={hairlineSx(isInView, delay)} />
            <Stack direction="row" sx={{ pt: u(14), gap: u(isMobile ? 14 : 22), ...revealSx(isInView, delay + 100) }}>
              <Typography sx={{ ...aboutTextSx, flexShrink: 0, width: u(22), fontWeight: 400, fontSize: u(12), color: MUTED }}>
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h3" sx={{ ...aboutKoreanSx, fontWeight: 600, fontSize: u(isMobile ? 17 : 18), color: '#ffffff' }}>
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    ...aboutKoreanSx,
                    mt: u(6),
                    fontWeight: 400,
                    fontSize: u(13),
                    lineHeight: 1.55,
                    color: MUTED,
                    wordBreak: 'keep-all',
                  }}
                >
                  {item.body}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Box>
  </Box>
);

// 메인 페이지 구조 — 기존 → 변경을 두 단으로 나란히, 위에 단 수(9 → 7)를 크게
const StructureCompare = ({ structure, isInView, delay, u }) => {
  const column = (title, rows, isAfter) => (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ ...aboutTextSx, fontSize: u(12), letterSpacing: '0.12em', color: isAfter ? '#ffffff' : MUTED }}>
        {title}
      </Typography>
      <Box component="ol" sx={{ m: 0, mt: u(10), p: 0, listStyle: 'none' }}>
        {rows.map((row, index) => (
          <Box
            // 기존 구조엔 '마스크팩 광고'가 두 번 있어 순서를 함께 key로 쓴다
            key={`${index}-${row}`}
            component="li"
            sx={{
              ...aboutKoreanSx,
              py: u(3.5),
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: isAfter ? 600 : 400,
              fontSize: u(12),
              lineHeight: 1.35,
              color: isAfter ? '#ffffff' : MUTED,
            }}
          >
            {row}
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={revealSx(isInView, delay)}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: u(10) }}>
        <Typography sx={{ ...aboutTextSx, fontSize: u(12), letterSpacing: '0.12em', color: MUTED }}>MAIN PAGE</Typography>
        <Typography sx={{ ...aboutTextSx, fontFamily: '"Anton", sans-serif', fontWeight: 400, fontSize: u(30) }}>
          {structure.before.length}
          <Box component="span" sx={{ mx: u(8), color: MUTED, fontFamily: '"Alumni Sans", sans-serif', fontSize: u(22) }}>
            →
          </Box>
          {structure.after.length}
        </Typography>
        <Typography sx={{ ...aboutTextSx, fontSize: u(12), letterSpacing: '0.12em', color: MUTED }}>SECTIONS</Typography>
      </Stack>
      <Stack direction="row" sx={{ mt: u(14), gap: u(20) }}>
        {column('BEFORE', structure.before, false)}
        {column('AFTER', structure.after, true)}
      </Stack>
    </Box>
  );
};

const ProjectCaseStudy = ({ project }) => {
  const [ref, isInView] = useInView(0.15);
  const isMobile = useIsMobile();
  const u = isMobile ? mpx : dpx;
  const { sections, caseStudy } = project;
  const directionTop = LIST.top + 30 + caseStudy.problems.length * ROW_HEIGHT + GROUP_GAP;

  return (
    // 앵커 id는 감싼 SceneFade가 원래 자리 표시에 붙인다 (sticky라 여기 붙이면 위치가 어긋난다)
    <FitStage ref={ref} {...aboutStageProps(isMobile)}>
      <Box sx={mobileFlowSx(isMobile)}>
        {/* 번호 + 구분선 */}
        <Box sx={{ ...placeSx(isMobile, { left: dpx(62), top: dpx(108) }), ...revealSx(isInView, 0) }}>
          <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(isMobile ? 40 : 52), letterSpacing: '-0.02em' }}>
            {sections[1].label}
          </Typography>
          <Typography sx={{ ...aboutTextSx, mt: u(isMobile ? 10 : 16), fontSize: u(isMobile ? 18 : 22), letterSpacing: '-0.01em' }}>
            {caseStudy.label}
          </Typography>
        </Box>
        <Box aria-hidden sx={sectionDividerSx(isMobile, isInView)} />

        {/* 큰 제목 — 리디자인의 브랜드 메시지 */}
        <Typography
          component="h2"
          sx={{
            ...aboutTextSx,
            ...placeSx(isMobile, { left: dpx(300), top: dpx(108) }, { mt: mpx(28) }),
            fontSize: u(isMobile ? 52 : 64),
            lineHeight: 1.02,
            letterSpacing: '-0.01em',
          }}
        >
          {caseStudy.heading.map((line, index) => (
            <Box key={line} component="span" sx={{ display: 'block', ...revealSx(isInView, 100 + index * 120) }}>
              {line}
            </Box>
          ))}
        </Typography>

        <Typography
          sx={{
            ...aboutKoreanSx,
            ...placeSx(isMobile, { left: dpx(300), top: dpx(262), width: dpx(330) }, { mt: mpx(20) }),
            fontWeight: 400,
            fontSize: u(14),
            lineHeight: 1.6,
            color: MUTED,
            wordBreak: 'keep-all',
            ...revealSx(isInView, 360),
          }}
        >
          {caseStudy.intro}
        </Typography>

        {/* 문제 → 개선 방향 */}
        <Box sx={placeSx(isMobile, { left: dpx(LIST.left), top: dpx(LIST.top), width: dpx(LIST.width) }, { mt: mpx(44) })}>
          <PointGroup label="PROBLEM" items={caseStudy.problems} isInView={isInView} startDelay={300} u={u} isMobile={isMobile} />
        </Box>
        <Box
          sx={placeSx(isMobile, { left: dpx(LIST.left), top: dpx(directionTop), width: dpx(LIST.width) }, { mt: mpx(28) })}
        >
          <PointGroup
            label="DIRECTION"
            items={caseStudy.directions}
            isInView={isInView}
            startDelay={700}
            accent
            u={u}
            isMobile={isMobile}
          />
        </Box>

        {/* 메인 페이지 구조 변화 — 왼쪽 아래 */}
        <Box sx={placeSx(isMobile, { left: dpx(300), top: dpx(392), width: dpx(330) }, { mt: mpx(36) })}>
          <StructureCompare structure={caseStudy.structure} isInView={isInView} delay={900} u={u} />
        </Box>
      </Box>

      <SectionNav activeIndex={1} sections={sections} label="프로젝트 상세 섹션" />
    </FitStage>
  );
};

export default ProjectCaseStudy;
