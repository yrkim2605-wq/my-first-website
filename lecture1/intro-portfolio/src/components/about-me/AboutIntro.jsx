import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from './SectionNav';
import { dpx } from '../../constants/typography';
import { aboutStageProps, aboutTextSx } from './aboutMeStyles';
import lazyAfternoon from '../../assets/lazy-afternoon.jpg';

// 01 About Me (시안: 자기소개.png)
// 어두운 방에 전등 하나가 켜지고, 전선에 매달린 그림이 불빛 아래에서 살짝 흔들린다.

const STAGE = { w: 1440, h: 784 };
const LAMP_X = 698; // 전등·전선·그림의 가운데 x (시안 px)
const BULB_Y = 86; // 전구 가운데 y
const BEAM_HALF = 600; // 바닥에서 빛기둥의 절반 너비
const FRAME = { top: 248, size: 346 };

// 그림이 가린 빛: 전구에서 그림 아래 모서리를 지나 바닥까지 뻗는 사다리꼴 (그림 기준 좌표)
const FRAME_BOTTOM = FRAME.top + FRAME.size - BULB_Y; // 전구에서 그림 아랫변까지
const SHADE = {
  top: FRAME_BOTTOM,
  height: STAGE.h - BULB_Y - FRAME_BOTTOM + 40,
  spread: (FRAME.size / 2) * ((STAGE.h - BULB_Y) / FRAME_BOTTOM - 1), // 바닥에서 양옆으로 더 벌어지는 폭
};

const pctX = (x) => `${((x / STAGE.w) * 100).toFixed(2)}%`;
const pctY = (y) => `${((y / STAGE.h) * 100).toFixed(2)}%`;

const lampOnSx = {
  animation: 'lampOn 1.4s ease-out both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

const AboutIntro = () => {
  return (
    <FitStage {...aboutStageProps}>
      {/* 불빛 — 전구에서 바닥까지 퍼지는 빛기둥
          전구 가까이는 따뜻하고 밝게, 멀어질수록·가장자리로 갈수록 옅어지고, 테두리는 흐릿하게 번진다 */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, filter: `blur(${dpx(10)})`, ...lampOnSx }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${pctX(LAMP_X - 22)} ${pctY(BULB_Y)}, ${pctX(LAMP_X + 22)} ${pctY(BULB_Y)}, ${pctX(LAMP_X + BEAM_HALF)} 100%, ${pctX(LAMP_X - BEAM_HALF)} 100%)`,
            background: [
              // 가운데 뜨거운 부분
              `radial-gradient(ellipse 30% 75% at ${pctX(LAMP_X)} ${pctY(BULB_Y)}, rgba(255, 244, 205, 0.45), transparent 70%)`,
              // 전체 빛 — 아래로 갈수록 옅어진다
              `radial-gradient(ellipse 55% 110% at ${pctX(LAMP_X)} ${pctY(BULB_Y)}, rgba(236, 226, 196, 0.42), rgba(190, 184, 162, 0.34) 45%, rgba(150, 146, 132, 0.28) 80%, rgba(125, 121, 110, 0.24))`,
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
          top: dpx(598),
          transform: 'translateX(-50%)',
          fontFamily: '"Anton", sans-serif',
          fontSize: dpx(250),
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
        sx={{ position: 'absolute', left: dpx(LAMP_X), top: 0, height: dpx(56), width: '1px', bgcolor: '#ffffff' }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X - 29),
          top: dpx(55),
          width: dpx(58),
          height: dpx(26),
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
          left: dpx(LAMP_X - 9),
          top: dpx(BULB_Y - 9),
          width: dpx(18),
          height: dpx(18),
          borderRadius: '50%',
          bgcolor: '#ffffff',
          boxShadow: `0 0 ${dpx(14)} ${dpx(6)} rgba(255, 248, 225, 0.9)`,
        }}
      />

      {/* 전선에 매달린 그림 — 전구 바로 아래를 축으로 천천히 흔들린다 */}
      <Box
        sx={{
          position: 'absolute',
          left: dpx(LAMP_X - FRAME.size / 2),
          top: dpx(BULB_Y),
          width: dpx(FRAME.size),
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
            left: dpx(-SHADE.spread),
            top: dpx(SHADE.top),
            width: dpx(FRAME.size + SHADE.spread * 2),
            height: dpx(SHADE.height),
            filter: `blur(${dpx(14)})`,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              clipPath: `polygon(${dpx(SHADE.spread)} 0, calc(100% - ${dpx(SHADE.spread)}) 0, 100% 100%, 0 100%)`,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.2))',
            },
          }}
        />

        <Box
          sx={{
            position: 'relative',
            height: dpx(FRAME.top - BULB_Y),
            mx: 'auto',
            width: '1px',
            bgcolor: 'rgba(255, 255, 255, 0.85)',
          }}
        >
          {[38, 74].map((y) => (
            <Box
              key={y}
              sx={{
                position: 'absolute',
                top: dpx(y - 4),
                left: dpx(-3.5),
                width: dpx(7),
                height: dpx(7),
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
              `0 ${dpx(2)} ${dpx(3)} rgba(0, 0, 0, 0.5)`,
              `0 ${dpx(22)} ${dpx(34)} rgba(0, 0, 0, 0.5)`,
              `0 ${dpx(48)} ${dpx(80)} rgba(0, 0, 0, 0.35)`,
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
                `inset 0 ${dpx(1.5)} 0 rgba(255, 244, 210, 0.45)`,
                `inset 0 ${dpx(-10)} ${dpx(16)} rgba(0, 0, 0, 0.28)`,
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

      {/* 왼쪽 소개 글 */}
      <Box sx={{ position: 'absolute', left: dpx(103), top: dpx(108) }}>
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(52), letterSpacing: '-0.02em' }}>01</Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(16), fontSize: dpx(22), letterSpacing: '-0.01em' }}>About Me</Typography>
      </Box>

      <Box sx={{ position: 'absolute', left: dpx(103), top: dpx(334) }}>
        <Typography
          component="h1"
          sx={{ ...aboutTextSx, fontSize: dpx(66), letterSpacing: '-0.02em', lineHeight: 0.9 }}
        >
          KIM YURI
        </Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(10), fontSize: dpx(22), letterSpacing: '-0.02em' }}>
          Web · Visual · UI/UX
        </Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(30), fontSize: dpx(14), lineHeight: 1.4, letterSpacing: '0.01em' }}>
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
