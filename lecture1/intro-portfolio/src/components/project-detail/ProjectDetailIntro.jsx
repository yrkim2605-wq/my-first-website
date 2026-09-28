import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from '../about-me/SectionNav';
import { dpx } from '../../constants/typography';
import { aboutKoreanSx, aboutStageProps, aboutTextSx } from '../about-me/aboutMeStyles';

// 프로젝트 상세 01 화면 (시안: 프로젝트 상세페이지.pdf, 1440 × 784 기준)
// 천장에 매달린 전등이 대표 이미지(sheet)를 비추고, 왼쪽 아래 작은 이미지(master)에서 sheet로 선이 이어진다.
// 구성은 모든 프로젝트가 같고, 글·이미지는 project(projectDetails.js)에서 받는다.

const STAGE = { w: 1440, h: 784 };
const LAMP_X = 732; // 전등·전선의 가운데 x (시안 px)
const BULB_Y = 77; // 전구 가운데 y
const BEAM_HALF = 420; // 바닥에서 빛기둥의 절반 너비
const SHEET = { left: 536, top: 236, width: 808, aspect: '1422 / 796' };
const MASTER = { left: 24, top: 553, width: 171 };
// master → sheet를 잇는 선 (꺾이는 점들)
const LINK_POINTS = [
  [196, 585],
  [270, 585],
  [SHEET.left - 5, 462],
];
// ROLE / TOOL / PERIOD 줄의 세로 가운데 위치 (위에서부터 차례로)
const ROW_CENTERS = [254, 327, 393];

const pctX = (x) => `${((x / STAGE.w) * 100).toFixed(2)}%`;
const pctY = (y) => `${((y / STAGE.h) * 100).toFixed(2)}%`;

// 등장 순서(초): 전선이 내려오고 → 전등이 깜빡이며 켜지고 → 시트가 불빛 아래 내려앉고
// → 왼쪽 글이 위에서부터 차례로 떠오르고 → 마지막에 master에서 시트로 선이 그려진다
const TIMING = {
  wire: 0,
  lamp: 0.45,
  persona: 1.0,
  sheet: 1.1,
  text: 0.5, // 왼쪽 글 시작 — 한 줄씩 0.1초 간격
  master: 1.4,
  link: 1.9,
  nav: 2.2,
};

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

// 키프레임(index.css)을 지연시간과 함께 붙인다. 움직임 줄이기 설정이면 바로 보인다
const enterSx = (name, delay, duration = 0.9) => ({
  animation: `${name} ${duration}s ${EASE_OUT} ${delay}s both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});

const lampOnSx = {
  animation: `lampOn 1.4s ease-out ${TIMING.lamp}s both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

const ProjectDetailIntro = ({ project }) => {
  const { sections, title, description, rows, persona, sheet, master } = project;

  return (
    <FitStage {...aboutStageProps}>
      {/* 불빛 — 전구에서 바닥까지 퍼지는 빛기둥 (자기소개 페이지와 같은 방식) */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, filter: `blur(${dpx(10)})`, ...lampOnSx }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${pctX(LAMP_X - 22)} ${pctY(BULB_Y)}, ${pctX(LAMP_X + 22)} ${pctY(BULB_Y)}, ${pctX(LAMP_X + BEAM_HALF)} 100%, ${pctX(LAMP_X - BEAM_HALF)} 100%)`,
            background: [
              `radial-gradient(ellipse 30% 75% at ${pctX(LAMP_X)} ${pctY(BULB_Y)}, rgba(255, 244, 205, 0.4), transparent 70%)`,
              `radial-gradient(ellipse 55% 110% at ${pctX(LAMP_X)} ${pctY(BULB_Y)}, rgba(236, 226, 196, 0.38), rgba(170, 165, 146, 0.22) 50%, rgba(40, 40, 36, 0.1) 95%)`,
            ].join(', '),
          }}
        />
      </Box>

      {/* 천장에서 내려와 시트 윗변까지 이어지는 전선 + 전등갓 + 전구 — 전선이 위에서부터 내려온다 */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X),
          top: 0,
          height: dpx(SHEET.top),
          width: '1px',
          bgcolor: '#ffffff',
          transformOrigin: 'top',
          ...enterSx('growDown', TIMING.wire, 1.1),
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X - 29),
          top: dpx(46),
          width: dpx(58),
          height: dpx(26),
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          background: 'linear-gradient(180deg, #4a4a4a 0%, #8a8a86 70%, #e9e4d4 100%)',
          ...enterSx('riseIn', TIMING.lamp - 0.2, 0.6),
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X - 70),
          top: dpx(BULB_Y - 70),
          width: dpx(140),
          height: dpx(140),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 248, 225, 0.55), rgba(255, 240, 200, 0.18) 35%, transparent 70%)',
          ...lampOnSx,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X - 7),
          top: dpx(BULB_Y - 7),
          width: dpx(14),
          height: dpx(14),
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: `0 0 ${dpx(14)} ${dpx(6)} rgba(255, 248, 225, 0.9)`,
          ...lampOnSx,
        }}
      />
      {/* 전선 위의 점 + AI Persona 표시 — 불이 켜진 뒤 점이 하나씩 톡 나타난다 */}
      {[116, 151].map((y, i) => (
        <Box
          key={y}
          aria-hidden
          sx={{
            position: 'absolute',
            left: dpx(LAMP_X - 3),
            top: dpx(y - 3),
            width: dpx(7),
            height: dpx(7),
            borderRadius: '50%',
            bgcolor: '#ffffff',
            ...enterSx('popIn', TIMING.persona + i * 0.12, 0.5),
          }}
        />
      ))}
      <Typography
        sx={{
          ...aboutTextSx,
          position: 'absolute',
          left: dpx(LAMP_X + 10),
          top: dpx(151),
          transform: 'translateY(-50%)',
          fontWeight: 400,
          fontSize: dpx(11),
          ...enterSx('riseIn', TIMING.persona + 0.25, 0.7),
        }}
      >
        {persona}
      </Typography>

      {/* 대표 이미지(sheet) — 불빛 아래 걸린 메인 이미지. 전선 끝에 매달리듯 위에서 살짝 내려앉는다
          이미지가 아직 없으면 같은 크기의 회색 자리 표시 상자를 보여 준다 */}
      <Box
        sx={{
          position: 'absolute',
          left: dpx(SHEET.left),
          top: dpx(SHEET.top),
          width: dpx(SHEET.width),
          aspectRatio: SHEET.aspect,
          boxShadow: `0 ${dpx(22)} ${dpx(50)} rgba(0, 0, 0, 0.55)`,
          transformOrigin: 'top center',
          ...enterSx('sheetIn', TIMING.sheet, 1.2),
        }}
      >
        {sheet.src ? (
          <Box
            component="img"
            src={sheet.src}
            alt={sheet.alt}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            role="img"
            aria-label={sheet.alt}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              bgcolor: '#bdbdbd',
            }}
          >
            <Typography sx={{ ...aboutTextSx, color: '#3a3a3a', fontSize: dpx(20) }}>SHEET IMAGE</Typography>
          </Box>
        )}
      </Box>

      {/* master → 시트를 잇는 선 — 시작 점이 나타난 뒤 선이 그려지고, 시트에 닿으면 끝 점이 톡 나타난다 */}
      <Box
        component="svg"
        aria-hidden
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          '& circle': { transformBox: 'fill-box', transformOrigin: 'center' },
        }}
      >
        <Box
          component="polyline"
          points={LINK_POINTS.map((point) => point.join(',')).join(' ')}
          pathLength={1}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray={1}
          sx={enterSx('drawLine', TIMING.link, 0.9)}
        />
        <Box
          component="circle"
          cx={LINK_POINTS[0][0]}
          cy={LINK_POINTS[0][1]}
          r={3.5}
          fill="#ffffff"
          sx={enterSx('popIn', TIMING.link - 0.15, 0.4)}
        />
        <Box
          component="circle"
          cx={LINK_POINTS[2][0]}
          cy={LINK_POINTS[2][1]}
          r={5}
          fill="#ffffff"
          sx={enterSx('popIn', TIMING.link + 0.8, 0.5)}
        />
      </Box>

      {/* 왼쪽 위 — 프로젝트 제목과 소개 (왼쪽 글은 위에서부터 한 줄씩 떠오른다) */}
      <Box sx={{ position: 'absolute', left: dpx(25), top: dpx(113), width: dpx(380) }}>
        <Typography
          component="h1"
          sx={{
            ...aboutTextSx,
            fontSize: dpx(23),
            letterSpacing: '-0.01em',
            whiteSpace: 'pre',
            ...enterSx('riseIn', TIMING.text),
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            ...aboutKoreanSx,
            mt: dpx(14),
            color: '#ffffff',
            fontWeight: 600,
            fontSize: dpx(12),
            lineHeight: 1.4,
            wordBreak: 'keep-all',
            ...enterSx('riseIn', TIMING.text + 0.1),
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* ROLE / TOOL / PERIOD */}
      {rows.map((row, i) => (
        <Box
          key={row.label}
          sx={{
            position: 'absolute',
            left: dpx(25),
            top: dpx(ROW_CENTERS[i]),
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            ...enterSx('riseIn', TIMING.text + 0.3 + i * 0.1),
          }}
        >
          <Typography sx={{ ...aboutTextSx, width: dpx(103), fontSize: dpx(17) }}>{row.label}</Typography>
          <Box>
            {row.lines.map((line) => (
              <Typography
                key={line}
                sx={{ ...aboutTextSx, fontSize: dpx(13.5), lineHeight: 1.4, whiteSpace: 'pre' }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      ))}

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(25),
          top: dpx(462),
          width: dpx(305),
          height: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          transformOrigin: 'left',
          ...enterSx('growRight', TIMING.text + 0.7, 1),
        }}
      />

      {/* 왼쪽 아래 — master 이름표 + 이미지 + 설명 */}
      <Box
        sx={{
          position: 'absolute',
          left: dpx(25),
          top: dpx(529),
          width: dpx(MASTER.left + MASTER.width - 25),
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: dpx(8),
          ...enterSx('riseIn', TIMING.master),
        }}
      >
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(11), whiteSpace: 'nowrap' }}>
          {master.label}
        </Typography>
        <Box aria-hidden sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.5)' }} />
      </Box>
      <Box
        component="img"
        src={master.src}
        alt={master.alt}
        sx={{
          position: 'absolute',
          left: dpx(MASTER.left),
          top: dpx(MASTER.top),
          width: dpx(MASTER.width),
          aspectRatio: '3 / 2',
          objectFit: 'cover',
          display: 'block',
          ...enterSx('riseIn', TIMING.master + 0.1),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: dpx(MASTER.left),
          top: dpx(672),
          width: dpx(MASTER.width),
          textAlign: 'right',
          ...enterSx('riseIn', TIMING.master + 0.2),
        }}
      >
        {master.captions.map((caption) => (
          <Typography key={caption} sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(11), lineHeight: 1.45 }}>
            {caption}
          </Typography>
        ))}
      </Box>

      {/* 오른쪽 01~04 표시와 Scroll 안내 — 모든 등장이 끝날 즈음 나타난다
          감싼 상자는 클릭을 막지 않고, 안의 링크만 눌린다 */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          '& a': { pointerEvents: 'auto' },
          ...enterSx('riseIn', TIMING.nav),
        }}
      >
        <SectionNav activeIndex={0} sections={sections} label="프로젝트 상세 섹션" />
      </Box>
    </FitStage>
  );
};

export default ProjectDetailIntro;
