import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import ArchiveBook, { CAPTION_H, COVER_PAD } from './ArchiveBook';
import SectionNav from '../about-me/SectionNav';
import useIsMobile from '../../hooks/useIsMobile';
import { dpx, mpx } from '../../constants/typography';
import {
  MOBILE_BOTTOM_SPACE,
  MOBILE_GUTTER,
  aboutKoreanSx,
  aboutStageProps,
  aboutTextSx,
  placeSx,
} from '../about-me/aboutMeStyles';

// 프로젝트 상세 01 화면 (시안: 프로젝트 상세페이지.pdf, 1440 × 784 기준)
// 천장에 매달린 전등이 대표 이미지(sheet)를 비추고, 왼쪽 아래 작은 이미지(master)에서 sheet로 선이 이어진다.
// 구성은 모든 프로젝트가 같고, 글·이미지는 project(projectDetails.js)에서 받는다.
// 모바일(390 기준): 제목·설명을 맨 위에, 그 아래 전등과 sheet(또는 책자)를 가운데 걸고, 나머지 글은 그 아래로 흐른다

const STAGE = { w: 1440, h: 784 };
const LAMP_X = 732; // 전등·전선의 가운데 x (시안 px) — 프로젝트에서 lampX를 주면 그 값을 쓴다
const BULB_Y = 77; // 전구 가운데 y
const BEAM_HALF = 420; // 바닥에서 빛기둥의 절반 너비
const SHEET = { left: 536, top: 236, width: 808, aspect: '1422 / 796' };
const MASTER = { left: 24, top: 553, width: 171, aspect: '3 / 2' };
const MASTER_GAP = 10; // master 이미지가 여러 장일 때 사이 간격
// master 이름표·설명·선은 이미지 위치에서 이만큼 떨어진다 (이미지를 옮기면 같이 따라간다)
const MASTER_LABEL_OFFSET = 24; // 이미지 윗변 → 이름표 가운데
const MASTER_CAPTION_GAP = 5; // 이미지 아랫변 → 설명
const MASTER_LINK_OFFSET = 32; // 이미지 윗변 → 선이 나가는 높이
// master → sheet를 잇는 선 (꺾이는 점들) — 시작점은 master 오른쪽 끝에 붙는다
const makeLinkPoints = (masterRight, linkY, sheetLeft) => [
  [masterRight + 1, linkY],
  [Math.max(270, masterRight + 16), linkY],
  [sheetLeft - 5, 462],
];
// '3 / 2' 같은 비율 글자 → 3 / 2 = 1.5
const parseAspect = (aspect) => {
  const [w, h] = aspect.split('/').map(Number);
  return w / h;
};
// ROLE / TOOL / PERIOD 줄의 세로 가운데 위치 (위에서부터 차례로)와 그 아래 구분선 위치
// 프로젝트에서 rowCenters / dividerY를 주면 그 값을 쓴다
const ROW_CENTERS = [254, 327, 393];
const DIVIDER_Y = 462;

// 전등 장면의 크기·위치 — 데스크톱은 1440 시안, 모바일은 390 시안 px
const DESKTOP_LAMP = {
  unit: dpx,
  w: STAGE.w,
  shade: { top: 46, w: 58, h: 26 },
  bulbY: BULB_Y,
  bulb: 14,
  glow: 140,
  beamTop: 22,
  beamHalf: BEAM_HALF,
  dots: [116, 151], // 전선 위의 점 y
};
const MOBILE_LAMP = {
  unit: mpx,
  w: 390,
  shade: { top: 34, w: 44, h: 20 },
  bulbY: 58,
  bulb: 11,
  glow: 106,
  beamTop: 16,
  beamHalf: 220,
  dots: [92, 114],
  lampX: 195,
  sheetTop: 140,
};
// 모바일 책자: 책 전체(표지 포함)를 780 단위 너비로 보고 화면 너비에 맞춘다 — 책등이 화면 가운데(390)
const MOBILE_BOOK_WIDTH = 780;
const bookUnit = (px) => `${+((px / MOBILE_BOOK_WIDTH) * 100).toFixed(3)}cqw`;
// 책 아래 화살표·쪽 번호는 손가락으로 누르기 좋게 화면 기준(mpx)으로 크게 그린다
const BOOK_NAV_SCALE = 1.25;
const bookNavUnit = (px) => mpx(px * BOOK_NAV_SCALE);
const BOOK_NAV_GAP = 14; // 책 아랫변 → 화살표 줄 (ArchiveBook과 같은 값, 책 단위)
const BOOK_NAV_H = 28 * BOOK_NAV_SCALE; // 화살표 줄 높이 (mpx)

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

// project: 섹션 번호(sections)를 담고 있는 프로젝트 전체 데이터
// data: 이 화면 하나에 실제로 쓰이는 글·이미지 — 기본은 project 자신(01 화면).
//   02 화면도 같은 구성으로 보여주고 싶을 때, project.second 같은 별도 데이터를 data로 넘기고
//   activeIndex·id로 몇 번째 화면인지 알려주면 이 컴포넌트를 그대로 재사용할 수 있다
const ProjectDetailIntro = ({ project, data = project, activeIndex = 0, id }) => {
  const isMobile = useIsMobile();
  const L = isMobile ? MOBILE_LAMP : DESKTOP_LAMP;
  const u = L.unit;
  const { sections } = project;
  const { title, description, rows, persona, sheet, book, master, character } = data;
  // 시트 위치·크기 — 프로젝트에서 sheet.left / width / aspect를 주면 그 값을 쓴다 (모바일은 화면 너비에 꽉 차게)
  // book이 있으면 시트 대신 넘겨 보는 책자가 전등 아래 걸리고, 선은 책 표지 왼쪽 끝에 닿는다
  const sheetAspect = sheet?.aspect ?? SHEET.aspect;
  const sheetBox = isMobile
    ? { left: MOBILE_GUTTER, top: MOBILE_LAMP.sheetTop, width: MOBILE_LAMP.w - MOBILE_GUTTER * 2, aspect: sheetAspect }
    : {
        left: book ? book.spineX - book.page.w - COVER_PAD : (sheet?.left ?? SHEET.left),
        top: SHEET.top,
        width: sheet?.width ?? SHEET.width,
        aspect: sheetAspect,
      };
  // 모바일 책자 — 표지 윗변이 전선 끝(sheetTop)에 닿도록 책 단위로 옮긴다
  const mobileBook = book && {
    ...book,
    spineX: MOBILE_BOOK_WIDTH / 2,
    top: (MOBILE_LAMP.sheetTop * MOBILE_BOOK_WIDTH) / MOBILE_LAMP.w + COVER_PAD,
  };
  // 모바일: 매달린 그림(시트·책자)이 끝나는 높이 → 그 아래부터 글이 흐른다
  const mobileHangBottom = mobileBook
    ? ((mobileBook.top + book.page.w + CAPTION_H + COVER_PAD + BOOK_NAV_GAP) * MOBILE_LAMP.w) / MOBILE_BOOK_WIDTH + BOOK_NAV_H
    : sheetBox.top + sheetBox.width / parseAspect(sheetAspect);
  const mobileSceneHeight = mobileHangBottom + 24; // 모바일: 전등 장면 상자의 높이 (이 아래부터 나머지 글이 흐른다)
  const floor = isMobile ? mobileSceneHeight - 8 : STAGE.h; // 빛기둥이 닿는 바닥

  const lampX = isMobile ? MOBILE_LAMP.lampX : (data.lampX ?? LAMP_X);
  const { bulbY } = L;
  const pctX = (x) => `${((x / L.w) * 100).toFixed(2)}%`;
  const pctY = (y) => `${((y / floor) * 100).toFixed(2)}%`;

  // 왼쪽 글 묶음 — 제목 위치와 너비(구분선·캐릭터 소개도 같은 너비로 맞춘다)
  const titleTop = data.titleTop ?? 113;
  const columnWidth = data.columnWidth ?? 305;
  // master → sheet 선 (master가 없으면 그을 곳이 없다) — 모바일은 글이 시트 아래로 내려가 이을 수 없으므로 뺀다
  const showLink = !isMobile && (data.showLink ?? Boolean(master));
  const rowCenters = data.rowCenters ?? ROW_CENTERS;
  const dividerY = data.dividerY ?? DIVIDER_Y;
  const masterImages = master ? (master.images ?? [{ src: master.src, alt: master.alt }]) : [];
  const masterWidth = master?.width ?? MASTER.width;
  const masterTop = master?.top ?? MASTER.top;
  const masterAspect = master?.aspect ?? MASTER.aspect;
  const masterImageWidth = (masterWidth - MASTER_GAP * (masterImages.length - 1)) / masterImages.length;
  const masterBottom = masterTop + masterImageWidth / parseAspect(masterAspect);
  const linkPoints = makeLinkPoints(MASTER.left + masterWidth, masterTop + MASTER_LINK_OFFSET, sheetBox.left);

  const stageProps = aboutStageProps(isMobile);

  return (
    <FitStage
      id={id}
      {...stageProps}
      // 모바일: 세로로 쌓되 order로 순서를 정한다 — 제목·설명(0) → 전등 장면(1) → 나머지 글(2)
      stageSx={{ ...stageProps.stageSx, ...(isMobile && { display: 'flex', flexDirection: 'column' }) }}
    >
      {/* 전등 장면 — 데스크톱에선 위치를 잡지 않는 껍데기라 안의 요소가 무대 기준으로 놓이고,
          모바일에선 제목 아래에 놓인 상자가 되어 전등·그림이 이 상자 기준으로 걸린다 */}
      <Box sx={isMobile ? { order: 1, position: 'relative', flexShrink: 0, height: mpx(mobileSceneHeight) } : {}}>
      {/* 불빛 — 전구에서 바닥까지 퍼지는 빛기둥 (자기소개 페이지와 같은 방식) */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: u(floor), filter: `blur(${u(10)})`, ...lampOnSx }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${pctX(lampX - L.beamTop)} ${pctY(bulbY)}, ${pctX(lampX + L.beamTop)} ${pctY(bulbY)}, ${pctX(lampX + L.beamHalf)} 100%, ${pctX(lampX - L.beamHalf)} 100%)`,
            background: [
              `radial-gradient(ellipse 30% 75% at ${pctX(lampX)} ${pctY(bulbY)}, rgba(255, 244, 205, 0.4), transparent 70%)`,
              `radial-gradient(ellipse 55% 110% at ${pctX(lampX)} ${pctY(bulbY)}, rgba(236, 226, 196, 0.38), rgba(170, 165, 146, 0.22) 50%, rgba(40, 40, 36, 0.1) 95%)`,
            ].join(', '),
          }}
        />
      </Box>

      {/* 천장에서 내려와 시트 윗변까지 이어지는 전선 + 전등갓 + 전구 — 전선이 위에서부터 내려온다 */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX),
          top: 0,
          height: u(sheetBox.top),
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
          left: u(lampX - L.shade.w / 2),
          top: u(L.shade.top),
          width: u(L.shade.w),
          height: u(L.shade.h),
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          background: 'linear-gradient(180deg, #4a4a4a 0%, #8a8a86 70%, #e9e4d4 100%)',
          ...enterSx('riseIn', TIMING.lamp - 0.2, 0.6),
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX - L.glow / 2),
          top: u(bulbY - L.glow / 2),
          width: u(L.glow),
          height: u(L.glow),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 248, 225, 0.55), rgba(255, 240, 200, 0.18) 35%, transparent 70%)',
          ...lampOnSx,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX - L.bulb / 2),
          top: u(bulbY - L.bulb / 2),
          width: u(L.bulb),
          height: u(L.bulb),
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: `0 0 ${u(14)} ${u(6)} rgba(255, 248, 225, 0.9)`,
          ...lampOnSx,
        }}
      />
      {/* 전선 위의 점 + AI Persona 표시 — 불이 켜진 뒤 점이 하나씩 톡 나타난다 */}
      {L.dots.map((y, i) => (
        <Box
          key={y}
          aria-hidden
          sx={{
            position: 'absolute',
            left: u(lampX - 3),
            top: u(y - 3),
            width: u(7),
            height: u(7),
            borderRadius: '50%',
            bgcolor: '#ffffff',
            ...enterSx('popIn', TIMING.persona + i * 0.12, 0.5),
          }}
        />
      ))}
      {persona && (
      <Typography
        sx={{
          ...aboutTextSx,
          position: 'absolute',
          left: u(lampX + 10),
          top: u(L.dots[1]),
          transform: 'translateY(-50%)',
          fontWeight: 400,
          fontSize: u(11),
          ...enterSx('riseIn', TIMING.persona + 0.25, 0.7),
        }}
      >
        {persona}
      </Typography>
      )}

      {/* 대표 이미지(sheet) — 불빛 아래 걸린 메인 이미지. 전선 끝에 매달리듯 위에서 살짝 내려앉는다
          book이 있으면 그 자리에 넘겨 보는 책자가 같은 방식으로 내려앉는다
          이미지가 아직 없으면 같은 크기의 회색 자리 표시 상자를 보여 준다 */}
      {book ? (
        // zIndex: 확대된 그림이 master에서 오는 선보다 위에 오게 한다
        <ArchiveBook
          book={isMobile ? mobileBook : book}
          unit={isMobile ? bookUnit : dpx}
          navUnit={isMobile ? bookNavUnit : dpx}
          sx={{ zIndex: 1, transformOrigin: 'top center', ...enterSx('sheetIn', TIMING.sheet, 1.2) }}
        />
      ) : (
      <Box
        sx={{
          position: 'absolute',
          left: u(sheetBox.left),
          top: u(sheetBox.top),
          width: u(sheetBox.width),
          aspectRatio: sheetBox.aspect,
          boxShadow: `0 ${u(22)} ${u(50)} rgba(0, 0, 0, 0.55)`,
          transformOrigin: 'top center',
          ...enterSx('sheetIn', TIMING.sheet, 1.2),
        }}
      >
        {sheet.src ? (
          <Box
            component="img"
            // 첫 화면의 대표 이미지 — 다른 이미지보다 먼저 받는다
            fetchPriority="high"
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
            <Typography sx={{ ...aboutTextSx, color: '#3a3a3a', fontSize: u(20) }}>SHEET IMAGE</Typography>
          </Box>
        )}
      </Box>
      )}

      {/* master → 시트를 잇는 선 — 시작 점이 나타난 뒤 선이 그려지고, 시트에 닿으면 끝 점이 톡 나타난다 */}
      {showLink && (
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
          points={linkPoints.map((point) => point.join(',')).join(' ')}
          pathLength={1}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray={1}
          sx={enterSx('drawLine', TIMING.link, 0.9)}
        />
        <Box
          component="circle"
          cx={linkPoints[0][0]}
          cy={linkPoints[0][1]}
          r={3.5}
          fill="#ffffff"
          sx={enterSx('popIn', TIMING.link - 0.15, 0.4)}
        />
        <Box
          component="circle"
          cx={linkPoints[2][0]}
          cy={linkPoints[2][1]}
          r={5}
          fill="#ffffff"
          sx={enterSx('popIn', TIMING.link + 0.8, 0.5)}
        />
      </Box>
      )}
      </Box>

      {/* 왼쪽 글 묶음 — 데스크톱에선 위치를 잡지 않는 껍데기라 안의 요소가 무대 기준으로 놓인다
          모바일에선 껍데기를 없애(display: contents) 제목과 나머지 글이 각자 순서(order)대로 놓인다 */}
      <Box sx={isMobile ? { display: 'contents' } : {}}>
      {/* 프로젝트 제목과 소개 (왼쪽 글은 위에서부터 한 줄씩 떠오른다) */}
      <Box
        sx={placeSx(
          isMobile,
          { left: dpx(25), top: dpx(titleTop), width: dpx(Math.max(columnWidth, 380)) },
          { order: 0, px: mpx(MOBILE_GUTTER), pt: mpx(84), pb: mpx(12) },
        )}
      >
        <Typography
          component="h1"
          sx={{
            ...aboutTextSx,
            fontSize: u(isMobile ? 22 : 23),
            letterSpacing: '-0.01em',
            whiteSpace: isMobile ? 'pre-wrap' : 'pre',
            // titleDisplay: 제목을 화면에서 가장 큰 글씨(Anton)로 — 페이지의 주인공이 먼저 보이게
            ...(data.titleDisplay && {
              fontFamily: '"Anton", sans-serif',
              fontWeight: 400,
              fontSize: u(52),
              lineHeight: 1.02,
              letterSpacing: '0.005em',
            }),
            ...enterSx('riseIn', TIMING.text),
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            ...aboutKoreanSx,
            mt: u(14),
            color: '#ffffff',
            fontWeight: 600,
            fontSize: u(isMobile ? 14 : 12),
            lineHeight: isMobile ? 1.6 : 1.4,
            wordBreak: 'keep-all',
            // textWrap: balance — 마지막 줄에 한 단어만 떨어지지 않게 줄 길이를 고르게 나눈다
            ...(data.titleDisplay && {
              mt: u(16),
              width: isMobile ? 'auto' : dpx(columnWidth),
              fontWeight: 400,
              lineHeight: 1.6,
              textWrap: 'balance',
            }),
            ...enterSx('riseIn', TIMING.text + 0.1),
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* ROLE / TOOL / PERIOD — 모바일에선 제목 바로 아래(전등 장면 위)에 놓인다 */}
      <Box
        sx={
          isMobile
            ? { order: 0, display: 'flex', flexDirection: 'column', gap: mpx(14), px: mpx(MOBILE_GUTTER), pt: mpx(16), pb: mpx(12) }
            : {}
        }
      >
        {rows.map((row, i) => (
          <Box
            key={row.label}
            sx={{
              ...placeSx(isMobile, { left: dpx(25), top: dpx(rowCenters[i]), transform: 'translateY(-50%)' }),
              display: 'flex',
              alignItems: 'center',
              ...enterSx('riseIn', TIMING.text + 0.3 + i * 0.1),
            }}
          >
            <Typography sx={{ ...aboutTextSx, flexShrink: 0, width: u(isMobile ? 96 : 103), fontSize: u(17) }}>{row.label}</Typography>
            <Box>
              {row.lines.map((line) => (
                <Typography
                  key={line}
                  sx={{ ...aboutTextSx, fontSize: u(isMobile ? 15 : 13.5), lineHeight: 1.4, whiteSpace: isMobile ? 'pre-wrap' : 'pre' }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* 나머지 글 — 모바일에선 전등 장면 아래에 놓인다 */}
      <Box sx={isMobile ? { order: 2, px: mpx(MOBILE_GUTTER), pb: mpx(MOBILE_BOTTOM_SPACE) } : {}}>
      {/* 정보 줄 아래 구분선 — 모바일에선 사이에 전등 장면이 들어가 나눌 필요가 없어 숨긴다 */}
      <Box
        aria-hidden
        sx={{
          ...placeSx(isMobile, { left: dpx(25), top: dpx(dividerY), width: dpx(columnWidth) }, { display: 'none' }),
          height: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          transformOrigin: 'left',
          ...enterSx('growRight', TIMING.text + 0.7, 1),
        }}
      />

      {/* 구분선 아래 — 캐릭터 소개 (character가 있는 프로젝트만) */}
      {character && (
        <Box
          sx={{
            ...placeSx(isMobile, { left: dpx(25), top: dpx(dividerY + 24), width: dpx(columnWidth) }, { mt: mpx(24) }),
            ...enterSx('riseIn', TIMING.text + 0.8),
          }}
        >
          <Typography sx={{ ...aboutTextSx, fontSize: u(12), letterSpacing: '0.08em', color: '#a3a3a3' }}>
            {character.label}
          </Typography>
          <Box sx={{ mt: u(8), display: 'flex', alignItems: 'baseline', gap: u(8) }}>
            <Typography component="h2" sx={{ ...aboutTextSx, fontFamily: '"Anton", sans-serif', fontWeight: 400, fontSize: u(30) }}>
              {character.name}
            </Typography>
            <Typography sx={{ ...aboutKoreanSx, color: '#ffffff', fontSize: u(12) }}>{character.nameKo}</Typography>
          </Box>
          <Box sx={{ mt: u(8) }}>
            {character.description.map((line) => (
              <Typography
                key={line}
                sx={{ ...aboutKoreanSx, color: '#ffffff', fontSize: u(isMobile ? 14 : 12), lineHeight: 1.6, wordBreak: 'keep-all', textWrap: 'balance' }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      {/* 왼쪽 아래 — master 이름표 + 이미지 + 설명 (master가 있는 화면만) — 모바일은 화면 너비에 꽉 차게 */}
      {master && (
      <>
      <Box
        sx={{
          ...placeSx(
            isMobile,
            {
              left: dpx(25),
              top: dpx(masterTop - MASTER_LABEL_OFFSET),
              width: dpx(MASTER.left + masterWidth - 25),
              transform: 'translateY(-50%)',
            },
            { mt: mpx(36) },
          ),
          display: 'flex',
          alignItems: 'center',
          gap: u(8),
          ...enterSx('riseIn', TIMING.master),
        }}
      >
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(isMobile ? 13 : 11), whiteSpace: 'nowrap' }}>
          {master.label}
        </Typography>
        <Box aria-hidden sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.5)' }} />
      </Box>
      <Box
        sx={{
          ...placeSx(isMobile, { left: dpx(MASTER.left), top: dpx(masterTop), width: dpx(masterWidth) }, { mt: mpx(14) }),
          display: 'flex',
          gap: u(MASTER_GAP),
          ...enterSx('riseIn', TIMING.master + 0.1),
        }}
      >
        {masterImages.map((image) => (
          <Box
            key={image.src}
            component="img"
            loading="lazy"
            decoding="async"
            src={image.src}
            alt={image.alt}
            sx={{
              flex: 1,
              minWidth: 0,
              aspectRatio: masterAspect,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ))}
      </Box>
      {master.captions && (
      <Box
        sx={{
          ...placeSx(
            isMobile,
            { left: dpx(MASTER.left), top: dpx(masterBottom + MASTER_CAPTION_GAP), width: dpx(masterWidth) },
            { mt: mpx(MASTER_CAPTION_GAP) },
          ),
          textAlign: 'right',
          ...enterSx('riseIn', TIMING.master + 0.2),
        }}
      >
        {master.captions.map((caption) => (
          <Typography key={caption} sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(isMobile ? 13 : 11), lineHeight: 1.45 }}>
            {caption}
          </Typography>
        ))}
      </Box>
      )}
      </>
      )}
      </Box>
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
        <SectionNav activeIndex={activeIndex} sections={sections} label="프로젝트 상세 섹션" />
      </Box>
    </FitStage>
  );
};

export default ProjectDetailIntro;
