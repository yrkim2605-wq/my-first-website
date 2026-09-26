import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import FitStage from './FitStage';

// image: 나중에 이미지 경로를 넣으면 회색 박스 대신 이미지가 보인다
// link: CLICK을 눌렀을 때 열릴 주소 (없으면 null)
// backdrop: 카드가 맨 위에 있을 때 뒤에 깔리는 선 장식 ('rays' | 'petals' | 'arcs')
// aspect: 카드 비율
const PROJECTS = [
  {
    title: 'DR.JART+ WEBSITE REDESIGN',
    body: '더마 코스메틱 브랜드 Dr.Jart+의 웹사이트를 리디자인한 프로젝트',
    image: null,
    link: null,
    backdrop: 'rays',
    aspect: '3 / 4',
  },
  {
    title: 'AI INFLUENCER PROJECT  X  SIWOOENT',
    body: 'AI 인플루언서를 기획하여 이미지 및 영상을 제작하여 시우이엔티 기업 인스타그램 운영 및 이커머스 판매',
    image: null,
    link: null,
    backdrop: 'petals',
    aspect: '3 / 4',
  },
  {
    title: 'ILLUSTRATION ARCHIVE',
    body: 'CLIP STUDIO 를 활용해 다양한 캐릭터와 비주얼 스타일 제작',
    image: null,
    link: null,
    backdrop: 'arcs',
    aspect: '1 / 1',
  },
];

// 좌표·크기는 2000 × 955 시안 기준 (cqw = 무대 너비의 1%)
const STAGE_HEIGHT = (955 / 2000) * 100; // 47.75cqw
const CARD_WIDTH = 33.5; // cqw
const CARD_START_TOP = 26.3; // cqw — 처음 카드 위치
// 쌓임 상태별 카드 배치 (시안 좌표): STACK_LAYOUTS[k][i] = k번 카드가 맨 위일 때 i번 카드의 위치·크기
const STACK_LAYOUTS = [
  [{ top: 14.25, scale: 1 }],
  [{ top: 9.85, scale: 0.9 }, { top: 14.25, scale: 1 }],
  [{ top: 7.25, scale: 0.78 }, { top: 8.75, scale: 0.87 }, { top: 10.4, scale: 1 }],
];
const STEP_VH = 80; // 카드 한 장이 올라오는 데 필요한 스크롤 양 (창 높이 %)
const STEPS = PROJECTS.length; // 첫 카드 올라오기 + 나머지 카드들
const HOLD_VH = 40; // 마지막 카드가 쌓인 뒤 잠시 머무는 스크롤 양

const LINE_STROKE = 'rgba(255, 255, 255, 0.4)';

// 방사형 선: 카드 뒤 중심점에서 바깥으로 퍼진다
const RAY_CENTER = [1010, 762];
const RAY_ENDS = [
  [420, 180], [672, 127], [866, 155], [1037, 125], [1193, 142], [1383, 127],
  [1642, 142], [1655, 428], [1642, 602], [1642, 762], [392, 762], [331, 615], [400, 429],
];
const RAY_INNER = 0.4; // 중심에서 이 비율만큼 떨어진 곳부터 선을 그린다

// 꽃잎: 화면 아래 가운데에서 다섯 장이 피어난다 (angle: 위쪽 기준 회전각)
const PETAL_CENTER = [1010, 1000];
const PETALS = [
  { angle: 0, length: 900, width: 170 },
  { angle: -48, length: 860, width: 230 },
  { angle: 48, length: 860, width: 230 },
  { angle: -74, length: 880, width: 200 },
  { angle: 74, length: 880, width: 200 },
];
const petalPath = ({ length: l, width: w }) =>
  `M0,0 C${w},${-l * 0.3} ${w * 0.9},${-l} 0,${-l} C${-w * 0.9},${-l} ${-w},${-l * 0.3} 0,0`;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) ** 3;

// 스크롤 진행도(0 ~ STEPS)를 계산한다
const useStackProgress = (ref) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const scrolled = -el.getBoundingClientRect().top;
      const step = (window.innerHeight * STEP_VH) / 100;
      setProgress(clamp(scrolled / step, 0, STEPS));
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [ref]);

  return progress;
};

// 카드 i의 위치·기울기·크기를 진행도로부터 계산한다
// 진행도 i → i+1: i번 카드가 올라와 자리 잡는다 (그동안 아래 카드들은 다음 배치로 밀린다)
const cardStyle = (i, progress) => {
  let top;
  let scale = 1;
  let tilt = 0;
  if (progress <= i + 1) {
    const local = easeOut(clamp(progress - i, 0, 1));
    const from = i === 0 ? CARD_START_TOP : STAGE_HEIGHT + 2; // 무대 아래에서 올라온다
    top = lerp(from, STACK_LAYOUTS[i][i].top, local);
    if (i > 0) tilt = (1 - local) * 28; // 책장이 펴지듯 기울기가 0으로
  } else {
    const state = progress - 1; // 0 ~ STEPS-1: 지금 맨 위 카드 번호 (연속값)
    const s0 = Math.floor(state);
    const s1 = Math.min(s0 + 1, STEPS - 1);
    const t = easeOut(state - s0);
    top = lerp(STACK_LAYOUTS[s0][i].top, STACK_LAYOUTS[s1][i].top, t);
    scale = lerp(STACK_LAYOUTS[s0][i].scale, STACK_LAYOUTS[s1][i].scale, t);
  }
  // 덮인 카드는 윗부분만 남기고 잘라, 짧은 카드 아래로 긴 카드가 삐져나오지 않게 한다
  const covered = clamp(progress - (i + 1), 0, 1);
  return {
    transform: `perspective(120cqw) translateY(${top}cqw) rotateX(${tilt}deg) scale(${scale})`,
    clipPath: `inset(0 0 ${covered * 65}% 0)`,
  };
};

// 지금 맨 위에 자리 잡은 카드 번호 (카드가 절반 이상 올라오면 바뀐다)
const activeIndex = (progress) => clamp(Math.floor(progress + 0.5) - 1, 0, STEPS - 1);

const fadeSx = (visible) => ({
  opacity: visible ? 1 : 0,
  transition: 'opacity 0.5s ease',
  pointerEvents: visible ? 'auto' : 'none',
});

const Rays = () => (
  <g>
    {RAY_ENDS.map(([x, y]) => (
      <line
        key={`${x}-${y}`}
        x1={lerp(RAY_CENTER[0], x, RAY_INNER)}
        y1={lerp(RAY_CENTER[1], y, RAY_INNER)}
        x2={x}
        y2={y}
        stroke={LINE_STROKE}
        strokeWidth={1.5}
      />
    ))}
  </g>
);

const Petals = () => (
  <g transform={`translate(${PETAL_CENTER[0]} ${PETAL_CENTER[1]})`}>
    {PETALS.map((petal) => (
      <path
        key={petal.angle}
        d={petalPath(petal)}
        transform={`rotate(${petal.angle})`}
        fill="none"
        stroke={LINE_STROKE}
        strokeWidth={1.5}
      />
    ))}
  </g>
);

// 곡선: 화면 아래에서 솟아오르는 반타원들 [왼쪽 끝 x, 오른쪽 끝 x, 꼭대기 y]
const ARCS = [
  [175, 1847, 96],
  [185, 1470, 403], [185, 1235, 533], [185, 1060, 633],
  [185, 910, 705], [185, 808, 753], [185, 720, 793],
];

const Arcs = () => (
  <g>
    {ARCS.map(([left, right, top]) => (
      <path
        key={right}
        d={`M${left},955 A${(right - left) / 2},${955 - top} 0 0 1 ${right},955`}
        fill="none"
        stroke={LINE_STROKE}
        strokeWidth={1.5}
      />
    ))}
  </g>
);

const BACKDROPS = { rays: Rays, petals: Petals, arcs: Arcs };

const ProjectCard = ({ project, index }) => (
  <Box
    sx={{
      position: 'relative',
      width: '100%',
      aspectRatio: project.aspect,
      bgcolor: '#bdbdbd',
      backgroundImage: project.image ? `url(${project.image})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      color: '#3a3a3a',
      boxShadow: '0 -1cqw 3cqw rgba(0, 0, 0, 0.45)',
    }}
  >
    {!project.image && (
      <Stack
        sx={{
          position: 'absolute',
          inset: 0,
          p: { xs: 2, md: '1.4cqw' },
          gap: { xs: 1, md: '0.6cqw' },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontSize: { xs: 28, md: '2.6cqw' },
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: { xs: 16, md: '1.2cqw' },
            letterSpacing: '-0.02em',
          }}
        >
          PROJECT IMAGE
        </Typography>
      </Stack>
    )}
  </Box>
);

const Intro = ({ sizes }) => (
  <Stack spacing={sizes.gap}>
    <Typography
      component="h2"
      sx={{
        fontFamily: '"Anton", sans-serif',
        fontWeight: 400,
        fontSize: sizes.title,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      SELECTED PROJECTS
    </Typography>
    <Stack spacing={sizes.subGap}>
      <Typography
        sx={{
          fontFamily: '"Alumni Sans", sans-serif',
          fontWeight: 600,
          fontSize: sizes.sub,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        TURNING IDEAS INTO VISUAL EXPERIENCES ACROSS DESIGN, WEB AND AI
      </Typography>
      <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: sizes.ko, letterSpacing: '-0.02em' }}>
        아이디어를 다양한 방식으로 탐구하고 시각적 경험으로 구현한 프로젝트 입니다.
      </Typography>
    </Stack>
  </Stack>
);

const ProjectInfo = ({ project, sizes }) => (
  <Stack spacing={sizes.gap}>
    <Typography
      sx={{
        fontFamily: '"Alumni Sans", sans-serif',
        fontWeight: 600,
        fontSize: sizes.title,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        whiteSpace: 'pre-wrap',
      }}
    >
      {project.title}
    </Typography>
    <Typography
      sx={{
        fontFamily: '"Inter", sans-serif',
        fontWeight: 600,
        fontSize: sizes.body,
        lineHeight: 1.35,
        maxWidth: sizes.bodyWidth,
        wordBreak: 'keep-all',
      }}
    >
      {project.body}
    </Typography>
  </Stack>
);

const ClickHint = ({ link }) => (
  <Stack
    component={link ? 'a' : 'div'}
    href={link ?? undefined}
    target={link ? '_blank' : undefined}
    rel={link ? 'noreferrer' : undefined}
    direction="row"
    sx={{
      alignItems: 'center',
      gap: '0.8cqw',
      color: '#ffffff',
      textDecoration: 'none',
      cursor: 'pointer',
      '&:hover': { opacity: 0.7 },
    }}
  >
    <ArrowBackIosNewRoundedIcon sx={{ fontSize: '1.1cqw' }} />
    <Typography
      sx={{
        fontFamily: '"Alumni Sans", sans-serif',
        fontWeight: 600,
        fontSize: '1.4cqw',
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}
    >
      CLICK
    </Typography>
  </Stack>
);

const Projects = () => {
  const sectionRef = useRef(null);
  const progress = useStackProgress(sectionRef);
  const active = activeIndex(progress);

  return (
    <Box
      id="projects"
      ref={sectionRef}
      sx={{
        bgcolor: '#000000',
        color: '#ffffff',
        // 고정된 무대가 머무는 동안 스크롤할 수 있는 길이
        height: { md: `calc(100svh + ${STEPS * STEP_VH + HOLD_VH}svh)` },
      }}
    >
      {/* Desktop: 스크롤하면 카드가 아래에서 올라와 책장처럼 포개진다 */}
      <FitStage
        ratio={[2000, 955]}
        sx={{ display: { xs: 'none', md: 'flex' }, position: 'sticky', top: 0 }}
      >
        {/* 배경 선 장식 — 맨 위 카드에 맞춰 바뀐다 */}
        {PROJECTS.map((project, i) => {
          const Backdrop = BACKDROPS[project.backdrop];
          return (
            <Box
              key={project.title}
              component="svg"
              viewBox="0 0 2000 955"
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                ...fadeSx(i === active),
              }}
            >
              <Backdrop />
            </Box>
          );
        })}

        {/* 왼쪽 위 글 — 처음엔 섹션 소개, 두 번째 카드부터는 그 프로젝트 소개 */}
        <Box sx={{ position: 'absolute', left: '1.4cqw', top: '4.6cqw', ...fadeSx(active === 0) }}>
          <Intro
            sizes={{ title: dpx(65), sub: dpx(25), ko: dpx(12), gap: '1.6cqw', subGap: '0.5cqw' }}
          />
        </Box>
        {PROJECTS.slice(1).map((project, i) => (
          <Box
            key={project.title}
            sx={{ position: 'absolute', left: '1.6cqw', top: '5.2cqw', ...fadeSx(active === i + 1) }}
          >
            <ProjectInfo
              project={project}
              sizes={{ title: dpx(25), body: dpx(12), bodyWidth: '26cqw', gap: '1.4cqw' }}
            />
          </Box>
        ))}

        {PROJECTS.map((project, i) => (
          <Box
            key={project.title}
            sx={{
              position: 'absolute',
              top: 0,
              left: `${50 - CARD_WIDTH / 2}cqw`,
              width: `${CARD_WIDTH}cqw`,
              transformOrigin: 'center top',
              willChange: 'transform',
              zIndex: i + 1,
            }}
            style={cardStyle(i, progress)}
          >
            <ProjectCard project={project} index={i} />
          </Box>
        ))}

        {/* CLICK — 맨 위 카드 오른쪽 위 */}
        {PROJECTS.map((project, i) => (
          <Box
            key={project.title}
            sx={{
              position: 'absolute',
              left: `${50 + CARD_WIDTH / 2 + 0.8}cqw`,
              top: `${STACK_LAYOUTS[i][i].top + 0.3}cqw`,
              zIndex: STEPS + 1,
              ...fadeSx(i === active && progress >= i + 0.5),
            }}
          >
            <ClickHint link={project.link} />
          </Box>
        ))}
      </FitStage>

      {/* Mobile: 세로 목록 */}
      <Stack spacing={6} sx={{ display: { xs: 'flex', md: 'none' }, px: 3, py: 8 }}>
        <Intro sizes={{ title: '12vw', sub: 18, ko: 13, gap: 2, subGap: 1 }} />
        {PROJECTS.map((project, i) => (
          <Stack key={project.title} spacing={2}>
            <ProjectCard project={project} index={i} />
            <ProjectInfo project={project} sizes={{ title: 20, body: 13, bodyWidth: 'none', gap: 1 }} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default Projects;
