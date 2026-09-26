import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import SkillsDiagram from './SkillsDiagram';

// 좌표는 2000 × 1026 시안 기준 (viewBox 단위)
// line: 선이 끝나는 지점, label: 글자 위치, anchor: 글자 정렬 기준
const CENTER = { x: 1017, y: 486 };

const SKILLS = [
  {
    title: 'PHOTOSHOP',
    line: [962, 213],
    label: [925, 186],
    subs: [
      { title: 'RETOUCHING', line: [893, 249], label: [857, 234] },
      { title: 'IMAGE EDITING', line: [743, 351], label: [696, 337] },
    ],
  },
  {
    title: 'ILLUSTRATOR',
    line: [366, 384],
    label: [343, 373],
    anchor: 'end',
    subs: [{ title: 'LOGO', line: [417, 428], label: [361, 422] }],
  },
  {
    title: 'FIGMA',
    line: [210, 599],
    label: [190, 604],
    anchor: 'end',
    subs: [
      { title: 'AUTO LAYOUT', line: [350, 634], label: [293, 643] },
      { title: 'INTERACTION', line: [820, 735], label: [762, 745] },
      { title: 'RESPONSIVE WEB', line: [792, 840], label: [751, 865] },
    ],
  },
  {
    title: 'HTML/CSS/JS',
    line: [418, 744],
    label: [345, 767],
    subs: [{ title: 'CODING', line: [1090, 236], label: [1100, 209] }],
  },
  {
    title: 'CLAUDE',
    line: [1430, 269],
    label: [1448, 262],
    anchor: 'start',
    subs: [{ title: 'IDEATION', line: [1183, 289], label: [1232, 261] }],
  },
  {
    title: 'SEEDANCE',
    line: [1131, 822],
    label: [1165, 840],
    subs: [
      { title: 'AI VIDEO', line: [1200, 793], label: [1236, 791] },
      { title: 'CREATION', line: [1262, 697], label: [1299, 709] },
    ],
  },
  {
    title: 'CAPCUT',
    line: [1715, 578],
    label: [1735, 591],
    anchor: 'start',
    subs: [
      { title: 'SHORT-FORM', line: [1281, 422], label: [1294, 416], anchor: 'start' },
      { title: 'VIDEO EDITING', line: [1468, 447], label: [1477, 446], anchor: 'start' },
      { title: 'CONTENT', line: [1370, 655], label: [1381, 656], anchor: 'start' },
    ],
  },
];

const SUB_COLOR = '#949494';
// 폰트 명세(1440px 기준)를 이 viewBox(2000) 단위로 환산: 25px → 34.7, 16px → 22.2
const TITLE_SIZE = (25 / 1440) * 2000;
const SUB_SIZE = (16 / 1440) * 2000;

// 시안의 거친 종이 질감을 내는 노이즈
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`;

const CAPTIONS = [
  '(03) SKILLS & TOOLS',
  'MOVE YOUR CURSOR TO EXPLORE',
  `${SKILLS.length} TOOLS — ${SKILLS.flatMap((skill) => skill.subs).length} SKILLS`,
];

const captionSx = {
  fontFamily: '"Alumni Sans", sans-serif',
  fontWeight: 600,
  fontSize: 'clamp(12px, 1.05vw, 16px)',
  letterSpacing: '0.02em',
  lineHeight: 1,
  color: 'rgba(17, 17, 17, 0.6)',
};

const Skills = () => {
  return (
    <Box
      sx={{
        bgcolor: '#c4c4c4',
        backgroundImage: NOISE,
        color: '#111111',
        px: { xs: 3, md: 0 },
        py: { xs: 8, md: 0 },
        height: { md: '100svh' },
        position: 'relative',
      }}
    >
      {/* Desktop radial diagram — 마우스에 반응한다 */}
      <SkillsDiagram
        skills={SKILLS}
        center={CENTER}
        subColor={SUB_COLOR}
        titleSize={TITLE_SIZE}
        subSize={SUB_SIZE}
      />

      {/* 아래 모서리 작은 캡션 — 편집 디자인 같은 정돈된 느낌 */}
      <Stack
        direction="row"
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'absolute',
          left: 30,
          right: 30,
          bottom: 26,
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {CAPTIONS.map((caption) => (
          <Typography key={caption} sx={captionSx}>
            {caption}
          </Typography>
        ))}
      </Stack>

      {/* Mobile fallback list */}
      <Stack spacing={2.5} sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
        <Box sx={{ width: 12, height: 12, bgcolor: '#000000', mb: 1 }} />
        {SKILLS.map((skill) => (
          <Stack key={skill.title} spacing={0.25} sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"Alumni Sans", sans-serif',
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.02em',
              }}
            >
              {skill.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Alumni Sans", sans-serif',
                fontWeight: 600,
                fontSize: 14,
                color: SUB_COLOR,
              }}
            >
              {skill.subs.map((sub) => sub.title).join(' · ')}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default Skills;
