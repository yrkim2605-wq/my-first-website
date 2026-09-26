import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import useScrollFrame from '../hooks/useScrollFrame';
import { isDesktop } from '../constants/decor';

// WHAT I DO ? 큐브 (참고: dayonedream.com 두 번째 섹션)
// 평소엔 납작한 검은 박스처럼 보이지만 사실은 정육면체다.
// 섹션에 들어오면 앞면에 할 수 있는 일이 한 글자씩 타이핑되고,
// 스크롤을 내리면 앞으로 굴러가며 앞면(목록)은 위로 넘어가고, 아랫면(WHAT I DO ?)이 올라와 앞에 선다.

const LINES = [
  'WEB DESIGN',
  'WEB CODING',
  'BRANDING & LOGO',
  'AI VIDEO',
  'SHORT-FORM CONTENT',
  'ILLUSTRATION',
];
const TOTAL_CHARS = LINES.join('').length;
const LINE_STARTS = LINES.map((_, i) => LINES.slice(0, i).join('').length); // 각 줄이 시작하는 글자 위치
const TYPE_INTERVAL_MS = 35;
const ROLL_END = 0.8; // 고정 구간의 80%까지 스크롤하는 동안 구르고, 나머지는 멈춰서 보여 준다

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const textSx = {
  fontFamily: '"Anton", sans-serif',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  color: '#ffffff',
};

// 두 면에 같이 쓰는 배경: 중심에서 퍼지는 가는 방사형 선 + 가운데 검정 원
const faceSx = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  bgcolor: '#000000',
  backgroundImage: `
    radial-gradient(circle, #000000 0 22%, transparent 22.5%),
    repeating-conic-gradient(from 0deg, rgba(255,255,255,0.28) 0deg 0.35deg, transparent 0.35deg 15deg)
  `,
};

// sectionRef: 두 번째 섹션(고정 구간 전체) — 데스크톱에선 이 구간의 스크롤 진행도로 굴린다
const WhatIDo = ({ sectionRef }) => {
  const boxRef = useRef(null);
  const cubeRef = useRef(null);
  const [isArrived, setIsArrived] = useState(false);
  const [typed, setTyped] = useState(0);

  useScrollFrame(() => {
    const box = boxRef.current;
    const cube = cubeRef.current;
    const section = sectionRef?.current;
    if (!box || !cube) return;

    let progress;
    if (isDesktop() && section) {
      const rect = section.getBoundingClientRect();
      progress = clamp(-rect.top / (rect.height - window.innerHeight) / ROLL_END, 0, 1);
    } else {
      // 모바일: 박스가 화면 아래쪽에서 가운데로 올라오는 동안 구른다
      const rect = box.getBoundingClientRect();
      progress = clamp((window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.45), 0, 1);
    }

    cube.style.transform = `rotateX(${easeInOut(progress) * 90}deg)`;

    // 박스가 화면 가운데쯤 올라오면 타이핑 시작, 다시 위로 벗어나면 처음부터 다시 쓰도록 되돌린다
    const arrived = box.getBoundingClientRect().top < window.innerHeight * 0.7;
    setIsArrived(arrived);
    if (!arrived) setTyped(0);
  });

  useEffect(() => {
    if (!isArrived) return undefined;
    const id = setInterval(() => {
      setTyped((count) => Math.min(count + 1, TOTAL_CHARS));
    }, TYPE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isArrived]);

  // 타이핑된 글자 수만큼 각 줄을 잘라 보여 준다
  const visibleLines = LINES.map((line, i) => line.slice(0, Math.max(typed - LINE_STARTS[i], 0)));
  // 커서는 아직 덜 쓴 줄에, 다 쓰면 마지막 줄 끝에 둔다
  const typingLine = visibleLines.findIndex((line, i) => line.length < LINES[i].length);
  const cursorLine = typingLine === -1 ? LINES.length - 1 : typingLine;

  return (
    <Box
      ref={boxRef}
      aria-label={`WHAT I DO ? ${LINES.join(', ')}`}
      sx={{
        mt: { xs: '10cqw', md: '4cqw' },
        width: { xs: '70cqw', md: '21.2cqw' },
        aspectRatio: '1 / 1',
        // 카메라를 가깝게 두어 구를 때 모서리가 앞으로 튀어나오는 원근감
        perspective: { xs: '210cqw', md: '64cqw' },
      }}
    >
      {/* 큐브를 반 변만큼 뒤로 밀어, 멈춰 있을 땐 앞면이 원래 박스 크기 그대로 보이게 한다 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: { xs: 'translateZ(-35cqw)', md: 'translateZ(-10.6cqw)' },
        }}
      >
        <Box
          ref={cubeRef}
          sx={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* 앞면: 할 수 있는 일 목록 — 섹션에 들어오면 타이핑된다 */}
          <Box
            sx={{
              ...faceSx,
              transform: { xs: 'translateZ(35cqw)', md: 'translateZ(10.6cqw)' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: '5cqw', md: '1.4cqw' },
              textAlign: 'left',
            }}
          >
            {visibleLines.map((line, i) => (
              <Typography
                key={LINES[i]}
                sx={{ ...textSx, fontSize: { xs: '6cqw', md: dpx(22) }, lineHeight: 1.2, minHeight: '1.2em' }}
              >
                {line}
                {isArrived && i === cursorLine && (
                  <Box component="span" sx={{ animation: 'blink 0.8s steps(1) infinite', ml: '0.05em' }}>
                    |
                  </Box>
                )}
              </Typography>
            ))}
          </Box>

          {/* 아랫면: WHAT I DO ? — 구르면 앞으로 올라온다 */}
          <Box
            sx={{
              ...faceSx,
              transform: {
                xs: 'rotateX(-90deg) translateZ(35cqw)',
                md: 'rotateX(-90deg) translateZ(10.6cqw)',
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ ...textSx, fontSize: { xs: '8cqw', md: dpx(30) } }}>WHAT I DO ?</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WhatIDo;
