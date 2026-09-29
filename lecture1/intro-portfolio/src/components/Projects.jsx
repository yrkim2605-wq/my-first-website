import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import FitStage from './FitStage';
import WaveText from './WaveText';
import { navigateWithFade } from '../utils/pageTransition';
import drJartThumb from '../assets/project-drjart.jpg';
import aiInfluencerThumb from '../assets/project-ai-influencer.jpg';
import illustrationThumb from '../assets/project-illustration.png';

// image: 나중에 이미지 경로를 넣으면 회색 박스 대신 이미지가 보인다
// link: CLICK·썸네일을 눌렀을 때 열릴 주소 (없으면 null)
//   외부 사이트(http…)는 새 탭으로, 포트폴리오 안의 페이지는 같은 탭에서 화면이 어두워지며 넘어간다
// backdrop: 카드가 맨 위에 있을 때 뒤에 깔리는 선 장식 ('rays' | 'petals' | 'arcs')
// aspect: 카드 비율
// framed: true면 카드에 흰 테두리를 둘러 검은 배경에서 또렷하게 보이게 한다
const PROJECTS = [
  {
    title: 'DR.JART+ REDESIGN',
    body: '"Doctor Joins Art, 의학과 예술의 만남"이라는 브랜드 가치를 실험실 무드의 과학적인 비주얼로 풀어낸 리디자인',
    image: drJartThumb, // 리디자인한 사이트의 데스크톱 첫 화면(hero) 캡처
    link: 'https://yrkim2605-wq.github.io/dr-jart-website/',
    backdrop: 'rays',
    aspect: '1440 / 800',
  },
  {
    title: 'AI INFLUENCER PROJECT  X  SIWOOENT',
    body: 'AI 인플루언서를 기획하여 이미지 및 영상을 제작하여 시우이엔티 기업 인스타그램 운영 및 이커머스 판매',
    image: aiInfluencerThumb, // AI 인플루언서 '이서연' 정면·옆모습
    link: `${import.meta.env.BASE_URL}project-ai.html`, // 프로젝트 상세 페이지
    backdrop: 'petals',
    aspect: '3 / 2',
  },
  {
    title: 'ILLUSTRATION ARCHIVE',
    body: 'CLIP STUDIO 를 활용해 다양한 캐릭터와 비주얼 스타일 제작',
    image: illustrationThumb, // 거울 캐릭터 일러스트
    link: `${import.meta.env.BASE_URL}project-illustration.html`, // 프로젝트 상세 페이지
    backdrop: 'arcs',
    aspect: '1 / 1',
    framed: true, // 이미지 가장자리가 검은색이라 배경과 섞이므로
  },
];

// 좌표·크기는 2000 × 955 시안 기준 (cqw = 무대 너비의 1%)
const CARD_WIDTH = 33.5; // cqw
const CARD_START_TOP = 27; // cqw — 처음 카드 위치 (아래 카드가 밑에 살짝만 보이도록)
const CARD_GAP = 1; // cqw — 쌓이기 전, 앞 카드와 그 밑에 대기하는 다음 카드 사이 간격
// 쌓임 상태별 카드 배치 (시안 좌표): STACK_LAYOUTS[k][i] = k번 카드가 맨 위일 때 i번 카드의 위치·크기
const STACK_LAYOUTS = [
  [{ top: 14.25, scale: 1 }],
  [{ top: 9.85, scale: 0.9 }, { top: 14.25, scale: 1 }],
  [{ top: 7.25, scale: 0.78 }, { top: 8.75, scale: 0.87 }, { top: 10.4, scale: 1 }],
];
// 카드 높이(cqw) — 너비와 비율로 계산한다
const cardHeight = (i) => {
  const [w, h] = PROJECTS[i].aspect.split('/').map(Number);
  return (CARD_WIDTH * h) / w;
};
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

// 링크 종류에 맞는 <a> 속성 — 외부 사이트는 새 탭, 내부 페이지는 페이드 전환 후 같은 탭
const linkProps = (link) => {
  if (!link) return {};
  if (/^https?:\/\//.test(link)) return { href: link, target: '_blank', rel: 'noreferrer' };
  return {
    href: link,
    onClick: (event) => {
      event.preventDefault();
      navigateWithFade(() => {
        window.location.href = link;
      });
    },
  };
};

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

// 카드 i의 세로 위치(cqw)를 진행도로부터 계산한다
// 진행도 i → i+1: i번 카드가 올라와 자리 잡는다 (그동안 아래 카드들은 다음 배치로 밀린다)
// 모든 카드는 차례가 오기 전까지 바로 앞 카드 밑에 CARD_GAP만큼 떨어져 대기하며 따라 올라온다
// (시안: 네번째 섹션.png — 첫 화면에서 두 번째 카드가 밑에 살짝 보인다)
const cardTop = (i, progress) => {
  if (progress <= i) {
    return i === 0 ? CARD_START_TOP : cardTop(i - 1, progress) + cardHeight(i - 1) + CARD_GAP;
  }
  if (progress <= i + 1) {
    return lerp(cardTop(i, i), STACK_LAYOUTS[i][i].top, easeOut(progress - i));
  }
  const state = progress - 1; // 0 ~ STEPS-1: 지금 맨 위 카드 번호 (연속값)
  const s0 = Math.floor(state);
  const s1 = Math.min(s0 + 1, STEPS - 1);
  return lerp(STACK_LAYOUTS[s0][i].top, STACK_LAYOUTS[s1][i].top, easeOut(state - s0));
};

const TILT_DEG = 28; // 카드가 올라오기 전 뒤로 젖혀진 각도

// 카드 i의 위치·기울기·크기·잘림을 진행도로부터 계산한다
const cardStyle = (i, progress) => {
  let scale = 1;
  // 모든 카드는 뒤로 젖혀진 채 대기하다가, 올라오면서 책장이 펴지듯 기울기가 0으로
  // (윗변을 기준으로 젖혀지므로 앞 카드와의 간격은 그대로다)
  const tilt = (1 - easeOut(clamp(progress - i, 0, 1))) * TILT_DEG;
  if (progress > i + 1) {
    const state = progress - 1;
    const s0 = Math.floor(state);
    const s1 = Math.min(s0 + 1, STEPS - 1);
    scale = lerp(STACK_LAYOUTS[s0][i].scale, STACK_LAYOUTS[s1][i].scale, easeOut(state - s0));
  }
  // 덮인 카드는 윗부분만 남기고 잘라, 짧은 카드 아래로 긴 카드가 삐져나오지 않게 한다
  const covered = clamp(progress - (i + 1), 0, 1);
  // 세 번째 카드부터는 앞 카드가 올라오기 시작하기 전까지 숨긴다 (무대 한참 아래에 대기하므로)
  const isWaiting = i >= 2 && progress < i - 1;
  return {
    transform: `perspective(120cqw) translateY(${cardTop(i, progress)}cqw) rotateX(${tilt}deg) scale(${scale})`,
    clipPath: `inset(0 0 ${covered * 65}% 0)`,
    visibility: isWaiting ? 'hidden' : 'visible',
  };
};

// CLICK의 세로 위치 — 첫 화면의 첫 카드 윗변 옆에 고정한다 (cqw)
// 카드들이 자리 잡은 뒤에도 이 높이는 맨 위 카드 옆 범위 안에 들어온다
const CLICK_TOP = CARD_START_TOP + 0.3;

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

// link: 주소가 있으면 썸네일을 눌러도 CLICK과 같은 곳이 열린다
const ProjectCard = ({ project, index, link }) => (
  <Box
    component={link ? 'a' : 'div'}
    {...linkProps(link)}
    aria-label={link ? `${project.title.replace(/\s+/g, ' ')} 열기` : undefined}
    sx={{
      display: 'block',
      cursor: link ? 'pointer' : 'default',
      position: 'relative',
      width: '100%',
      aspectRatio: project.aspect,
      bgcolor: '#bdbdbd',
      backgroundImage: project.image ? `url(${project.image})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      color: '#3a3a3a',
      border: project.framed ? { xs: '3px solid #ffffff', md: '0.25cqw solid #ffffff' } : 'none',
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

const Intro = ({ size }) => (
  <Typography
    component="h2"
    sx={{
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      fontSize: size,
      letterSpacing: '-0.02em',
      lineHeight: 1,
    }}
  >
    <WaveText text="SELECTED PROJECTS" charDelay={18} />
  </Typography>
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
    {...linkProps(link)}
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
        // 무대를 화면 아래에 붙인다 — 화면이 무대보다 세로로 길 때 남는 여백이 아래에 생기면
        // 첫 화면에서 두 번째 카드가 그만큼 더 드러나기 때문에, 여백을 위쪽으로 보낸다
        sx={{ display: { xs: 'none', md: 'flex' }, position: 'sticky', top: 0, alignItems: 'flex-end' }}
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

        {/* 왼쪽 위 글 — 섹션 제목은 고정, 그 밑의 프로젝트 소개만 맨 위 카드에 맞춰 바뀐다 */}
        <Stack spacing="1.6cqw" sx={{ position: 'absolute', left: '1.4cqw', top: '1cqw' }}>
          <Intro size={dpx(65)} />
          {/* 세 소개 글을 같은 칸에 겹쳐 두고 지금 카드의 글만 보이게 한다 */}
          <Box sx={{ display: 'grid' }}>
            {PROJECTS.map((project, i) => (
              <Box key={project.title} sx={{ gridArea: '1 / 1', ...fadeSx(active === i) }}>
                <ProjectInfo
                  project={project}
                  sizes={{ title: dpx(25), body: dpx(12), bodyWidth: '26cqw', gap: '1.4cqw' }}
                />
              </Box>
            ))}
          </Box>
        </Stack>

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
            {/* 맨 위 카드만 클릭된다 — 뒤로 포개진 카드의 윗부분을 잘못 눌러 열리지 않게 */}
            <ProjectCard project={project} index={i} link={i === active ? project.link : null} />
          </Box>
        ))}

        {/* CLICK — 맨 위 카드 오른쪽, 한 자리에 고정 (첫 카드는 첫 화면부터 보인다) */}
        {PROJECTS.map((project, i) => (
          <Box
            key={project.title}
            sx={{
              position: 'absolute',
              left: `${50 + CARD_WIDTH / 2 + 0.8}cqw`,
              zIndex: STEPS + 1,
              top: `${CLICK_TOP}cqw`,
              ...fadeSx(i === active && (i === 0 || progress >= i + 0.5)),
            }}
          >
            <ClickHint link={project.link} />
          </Box>
        ))}
      </FitStage>

      {/* Mobile: 세로 목록 */}
      <Stack spacing={6} sx={{ display: { xs: 'flex', md: 'none' }, px: 3, py: 8 }}>
        <Intro size="12vw" />
        {PROJECTS.map((project, i) => (
          <Stack key={project.title} spacing={2}>
            <ProjectCard project={project} index={i} link={project.link} />
            <ProjectInfo project={project} sizes={{ title: 20, body: 13, bodyWidth: 'none', gap: 1 }} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default Projects;
