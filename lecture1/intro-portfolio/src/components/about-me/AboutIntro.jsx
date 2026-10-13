import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from './SectionNav';
import useIsMobile from '../../hooks/useIsMobile';
import { dpx, mpx } from '../../constants/typography';
import { aboutStageProps, aboutTextSx } from './aboutMeStyles';
import lazyAfternoon from '../../assets/lazy-afternoon.jpg';

// 01 About Me (시안: 자기소개.png)
// 어두운 방에 전등 하나가 켜지고, 전선에 매달린 그림이 불빛 아래에서 살짝 흔들린다.
// 데스크톱은 1440 × 784 시안, 모바일은 390 × 780 세로 시안 좌표를 쓴다 (단위: 각 시안의 px)

const DESKTOP = {
  unit: dpx,
  w: 1440,
  floor: 784, // 빛기둥이 닿는 바닥 y
  lampX: 698, // 전등·전선·그림의 가운데 x
  cordH: 56, // 천장 → 전등갓
  shade: { top: 55, w: 58, h: 26 },
  bulbY: 86, // 전구 가운데 y
  bulb: 18,
  glow: 140,
  beamTop: 22, // 전구 높이에서 빛기둥의 절반 너비
  beamHalf: 600, // 바닥에서 빛기둥의 절반 너비
  frame: { top: 248, size: 346 },
  dots: [38, 74], // 전선 위 점 (전구에서 잰 거리)
  word: { top: 598, size: 250 },
  number: { left: 103, top: 108, size: 52, sub: 22, gap: 16 },
  name: { left: 103, top: 334, size: 66, sub: 22, subGap: 10, body: 14, bodyGap: 30 },
};

// 모바일: 전등과 그림을 위쪽 가운데에 걸고, 이름과 소개는 그 아래에 둔다
const MOBILE = {
  unit: mpx,
  w: 390,
  h: 780,
  floor: 560,
  lampX: 195,
  cordH: 42,
  shade: { top: 41, w: 44, h: 20 },
  bulbY: 66,
  bulb: 14,
  glow: 106,
  beamTop: 16,
  beamHalf: 230,
  frame: { top: 180, size: 240 },
  dots: [26, 54],
  word: { top: 446, size: 84 },
  number: { left: 20, top: 80, size: 40, sub: 18, gap: 10 },
  name: { left: 20, top: 590, size: 56, sub: 20, subGap: 8, body: 15, bodyGap: 20 },
};

const lampOnSx = {
  animation: 'lampOn 1.4s ease-out both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

const AboutIntro = () => {
  const isMobile = useIsMobile();
  const G = isMobile ? MOBILE : DESKTOP;
  const u = G.unit;
  const { lampX, bulbY, frame, shade, number, name } = G;

  const pctX = (x) => `${((x / G.w) * 100).toFixed(2)}%`;
  const pctY = (y) => `${((y / G.floor) * 100).toFixed(2)}%`;

  // 그림이 가린 빛: 전구에서 그림 아래 모서리를 지나 바닥까지 뻗는 사다리꼴 (그림 기준 좌표)
  const frameBottom = frame.top + frame.size - bulbY; // 전구에서 그림 아랫변까지
  const frameShadow = {
    top: frameBottom,
    height: G.floor - bulbY - frameBottom + 40,
    spread: (frame.size / 2) * ((G.floor - bulbY) / frameBottom - 1), // 바닥에서 양옆으로 더 벌어지는 폭
  };

  return (
    <FitStage {...aboutStageProps(isMobile, `${MOBILE.w} / ${MOBILE.h}`)}>
      {/* 불빛 — 전구에서 바닥까지 퍼지는 빛기둥
          전구 가까이는 따뜻하고 밝게, 멀어질수록·가장자리로 갈수록 옅어지고, 테두리는 흐릿하게 번진다 */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: u(G.floor), filter: `blur(${u(10)})`, ...lampOnSx }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${pctX(lampX - G.beamTop)} ${pctY(bulbY)}, ${pctX(lampX + G.beamTop)} ${pctY(bulbY)}, ${pctX(lampX + G.beamHalf)} 100%, ${pctX(lampX - G.beamHalf)} 100%)`,
            background: [
              // 가운데 뜨거운 부분
              `radial-gradient(ellipse 30% 75% at ${pctX(lampX)} ${pctY(bulbY)}, rgba(255, 244, 205, 0.45), transparent 70%)`,
              // 전체 빛 — 아래로 갈수록 옅어진다
              `radial-gradient(ellipse 55% 110% at ${pctX(lampX)} ${pctY(bulbY)}, rgba(236, 226, 196, 0.42), rgba(190, 184, 162, 0.34) 45%, rgba(150, 146, 132, 0.28) 80%, rgba(125, 121, 110, 0.24))`,
            ].join(', '),
          }}
        />
      </Box>

      {/* 바닥의 큰 글자 — 불빛 속에서만 실루엣으로 드러난다 */}
      <Typography
        aria-hidden
        sx={{
          position: 'absolute',
          left: '50%',
          top: u(G.word.top),
          transform: 'translateX(-50%)',
          fontFamily: '"Anton", sans-serif',
          fontSize: u(G.word.size),
          lineHeight: 1,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          color: '#000000',
          userSelect: 'none',
        }}
      >
        IDEA MADE
      </Typography>

      {/* 천장에서 내려오는 전선 + 전등갓 + 전구 */}
      <Box
        aria-hidden
        sx={{ position: 'absolute', left: u(lampX), top: 0, height: u(G.cordH), width: '1px', bgcolor: '#ffffff' }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX - shade.w / 2),
          top: u(shade.top),
          width: u(shade.w),
          height: u(shade.h),
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          // 바깥은 어둡고, 전구 빛을 받는 아래 테두리는 밝다
          background: 'linear-gradient(180deg, #4a4a4a 0%, #8a8a86 70%, #e9e4d4 100%)',
        }}
      />
      {/* 전구 주변으로 번지는 빛무리 */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX - G.glow / 2),
          top: u(bulbY - G.glow / 2),
          width: u(G.glow),
          height: u(G.glow),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 248, 225, 0.55), rgba(255, 240, 200, 0.18) 35%, transparent 70%)',
          ...lampOnSx,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: u(lampX - G.bulb / 2),
          top: u(bulbY - G.bulb / 2),
          width: u(G.bulb),
          height: u(G.bulb),
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: `0 0 ${u(14)} ${u(6)} rgba(255, 248, 225, 0.9)`,
        }}
      />

      {/* 전선에 매달린 그림 — 전구 바로 아래를 축으로 천천히 흔들린다 */}
      <Box
        sx={{
          position: 'absolute',
          left: u(lampX - frame.size / 2),
          top: u(bulbY),
          width: u(frame.size),
          transformOrigin: '50% 0',
          animation: 'frameSway 6s ease-in-out infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {/* 그림이 가린 빛 — 그림 아래쪽 빛기둥이 그만큼 어둡다.
            흔드는 축이 전구 위치와 같아서, 그림과 함께 돌면 그림자도 저절로 맞는 방향으로 움직인다 */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: u(-frameShadow.spread),
            top: u(frameShadow.top),
            width: u(frame.size + frameShadow.spread * 2),
            height: u(frameShadow.height),
            filter: `blur(${u(14)})`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              clipPath: `polygon(${u(frameShadow.spread)} 0, calc(100% - ${u(frameShadow.spread)}) 0, 100% 100%, 0 100%)`,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.2))',
            },
          }}
        />

        <Box
          sx={{
            position: 'relative',
            height: u(frame.top - bulbY),
            mx: 'auto',
            width: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.85)',
          }}
        >
          {G.dots.map((y) => (
            <Box
              key={y}
              sx={{
                position: 'absolute',
                top: u(y - 4),
                left: u(-3.5),
                width: u(7),
                height: u(7),
                borderRadius: '50%',
                bgcolor: '#ffffff',
              }}
            />
          ))}
        </Box>

        {/* 조명 아래 느낌 — 전체를 살짝 어둡고 누렇게, 전구와 가까운 윗부분 가운데가 가장 밝다
            그림자: 위에서 빛이 내려오므로 그림 아래로 짙게 떨어지고(겹겹이 퍼지게),
            윗변은 빛을 받아 밝고 아랫변은 그늘져 두께감이 생긴다 */}
        <Box
          sx={{
            position: 'relative',
            boxShadow: [
              `0 ${u(2)} ${u(3)} rgba(0, 0, 0, 0.5)`,
              `0 ${u(22)} ${u(34)} rgba(0, 0, 0, 0.5)`,
              `0 ${u(48)} ${u(80)} rgba(0, 0, 0, 0.35)`,
            ].join(', '),
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: [
                'radial-gradient(ellipse 90% 70% at 50% -15%, rgba(255, 238, 190, 0.2), transparent 70%)',
                'linear-gradient(180deg, rgba(255, 236, 170, 0.06) 0%, rgba(60, 50, 30, 0.12) 55%, rgba(20, 16, 8, 0.32) 100%)',
                // 좌우 끝은 빛기둥 가운데에서 멀어 조금 더 어둡다
                'linear-gradient(90deg, rgba(0, 0, 0, 0.12), transparent 25%, transparent 75%, rgba(0, 0, 0, 0.12))',
              ].join(', '),
              boxShadow: [
                `inset 0 ${u(1.5)} 0 rgba(255, 244, 210, 0.45)`,
                `inset 0 ${u(-10)} ${u(16)} rgba(0, 0, 0, 0.28)`,
              ].join(', '),
              pointerEvents: 'none',
            },
          }}
        >
          <Box
            component="img"
            src={lazyAfternoon}
            alt="Lazy Afternoon — 침대 위에서 느긋하게 쉬는 캐릭터 일러스트"
            sx={{
              display: 'block',
              width: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              filter: 'sepia(0.3) saturate(0.85) brightness(0.82) contrast(0.95)',
            }}
          />
        </Box>
      </Box>

      {/* 섹션 번호 */}
      <Box sx={{ position: 'absolute', left: u(number.left), top: u(number.top) }}>
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: u(number.size), letterSpacing: '-0.02em' }}>01</Typography>
        <Typography sx={{ ...aboutTextSx, mt: u(number.gap), fontSize: u(number.sub), letterSpacing: '-0.01em' }}>
          About Me
        </Typography>
      </Box>

      {/* 소개 글 — 데스크톱은 왼쪽, 모바일은 그림 아래 */}
      <Box sx={{ position: 'absolute', left: u(name.left), top: u(name.top) }}>
        <Typography
          component="h1"
          sx={{ ...aboutTextSx, fontSize: u(name.size), letterSpacing: '-0.02em', lineHeight: 0.9 }}
        >
          KIM YURI
        </Typography>
        <Typography sx={{ ...aboutTextSx, mt: u(name.subGap), fontSize: u(name.sub), letterSpacing: '-0.02em' }}>
          Web · Visual · UI/UX
        </Typography>
        <Typography sx={{ ...aboutTextSx, mt: u(name.bodyGap), fontSize: u(name.body), lineHeight: 1.4, letterSpacing: '0.01em' }}>
          Ideas begin with curiosity.
          <br />
          and become experiences
          <br />
          through design.
        </Typography>
      </Box>

      <SectionNav activeIndex={0} />
    </FitStage>
  );
};

export default AboutIntro;
