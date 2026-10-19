import { useEffect, useLayoutEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { navigateWithFade } from '../utils/pageTransition';
import drJartThumb from '../assets/project-drjart-mobile.webp';
import aiInfluencerThumb from '../assets/project-ai-influencer-left.webp';
import illustrationThumb from '../assets/project-illustration.webp';
import appleslateKeyringThumb from '../assets/project-appleslate-keyring.webp';
import bakeryThumb from '../assets/project-bakery-ribbon.webp';

// 카드가 둘러선 원기둥 (참고: dayonedream.com 히어로)
// - 카메라를 가깝게 두어(perspective) 앞쪽 카드는 크게, 뒤쪽 카드는 작게 보이는 강한 원근감
// - 카드 바깥면엔 이미지, 안쪽면은 연회색 → 뒤쪽에선 원기둥 안쪽 벽이 보인다
// - 카드 하나를 여러 조각으로 나눠 휘어진 곡면처럼 보이게 한다
// - 카드를 누르면 그 프로젝트로 이동한다 (끌어서 돌린 경우는 제외)
//
// 3D 공간(transform-style: preserve-3d)을 쓰지 않는다 — 브라우저가 조각들의 앞뒤를 가리다 틀려서,
// 회전하는 동안 안쪽 회색 면이나 뒤쪽 이미지 뒷면이 앞으로 비쳐 깜빡이는 환경이 있었다.
// 대신 조각마다 원근 변환(perspective())을 직접 주고, 앞면인지 뒷면인지와 그리는 순서(z-index)는 매 프레임 계산한다.

// 프로젝트 5장을 순서대로 두 번 반복해 열 장을 채운다 (애플슬레이트 키링은 일러스트 바로 오른쪽에 오도록)
// link: 아래 Projects 섹션과 같은 주소 — 외부 사이트는 새 탭, 포트폴리오 안의 페이지는 화면이 어두워지며 넘어간다
//   애플슬레이트 키링은 일러스트 상세 페이지의 굿즈 작업이라 그 페이지로 보낸다
const PROJECT_CARDS = [
  { image: drJartThumb, link: `${import.meta.env.BASE_URL}project-drjart.html` },
  { image: aiInfluencerThumb, link: `${import.meta.env.BASE_URL}project-ai.html` },
  { image: illustrationThumb, link: `${import.meta.env.BASE_URL}project-illustration.html` },
  { image: appleslateKeyringThumb, link: `${import.meta.env.BASE_URL}project-illustration.html` },
  // 빵집 리뷰 사이트 — 아래 Projects 섹션과 같은 배포 주소 (새 탭)
  { image: bakeryThumb, link: 'https://yrkim2605-wq.github.io/my-first-website/my-bakery-review/' },
];

// image: null이면 회색 그라데이션(tone), 있으면 프로젝트 이미지가 보인다
const PANELS = [
  { ...PROJECT_CARDS[0], tone: ['#1d1d1f', '#5a5a5e'] },
  { ...PROJECT_CARDS[1], tone: ['#2c2c2e', '#8a8a8e'] },
  { ...PROJECT_CARDS[2], tone: ['#141414', '#4a4a4a'] },
  { ...PROJECT_CARDS[3], tone: ['#3a3a3c', '#9c9ca0'] },
  { ...PROJECT_CARDS[4], tone: ['#202022', '#6e6e72'] },
  { ...PROJECT_CARDS[0], tone: ['#101010', '#565656'] },
  { ...PROJECT_CARDS[1], tone: ['#303032', '#7c7c80'] },
  { ...PROJECT_CARDS[2], tone: ['#1a1a1a', '#646464'] },
  { ...PROJECT_CARDS[3], tone: ['#262628', '#8e8e92'] },
  { ...PROJECT_CARDS[4], tone: ['#161618', '#5e5e62'] },
];

const SLICES_PER_PANEL = 8; // 카드 하나를 곡면처럼 보이게 나누는 조각 수
const GAP_DEG = 2.4; // 카드 사이 흰 틈 (각도)
const RADIUS = 21; // cqw
const BAND_HEIGHT = 17; // cqw
const PERSPECTIVE = 50; // cqw — 작을수록 카메라가 가까워 원근감이 강하다
const TILT_X_DEG = -26; // 위에서 비스듬히 내려다보는 각도
const TILT_Z_DEG = -26;
const SPIN_SECONDS = 60; // 가만히 두면 한 바퀴 도는 시간
const DRAG_SENSITIVITY = 0.35; // 드래그 1px당 도는 각도(deg)
const CLICK_SLOP = 6; // px — 이보다 적게 움직이고 떼면 끌기가 아니라 카드 클릭으로 본다
const MAX_FRAME_SECONDS = 0.1; // 탭을 다시 열었을 때 한꺼번에 튀어 돌지 않게 한 프레임에 돌 수 있는 시간의 한계

const openLink = (link) => {
  if (/^https?:\/\//.test(link)) {
    window.open(link, '_blank', 'noreferrer');
    return;
  }
  navigateWithFade(() => {
    window.location.href = link;
  });
};

const PANEL_DEG = 360 / PANELS.length;
const SLICE_DEG = (PANEL_DEG - GAP_DEG) / SLICES_PER_PANEL;
// 조각 사이에 머리카락 같은 틈이 보이지 않도록 살짝 겹친다
const SLICE_WIDTH = 2 * RADIUS * Math.tan((SLICE_DEG * Math.PI) / 360) + 0.06;

const SLICES = PANELS.flatMap((panel, p) =>
  Array.from({ length: SLICES_PER_PANEL }, (_, s) => ({
    key: `${p}-${s}`,
    panel,
    slice: s,
    angle: p * PANEL_DEG + (s + 0.5) * SLICE_DEG,
  })),
);

// 카드 이미지를 조각 수만큼 늘려 깔고, 조각마다 자기 몫의 위치만 보여 준다
const outerBackground = ({ panel, slice }) => ({
  backgroundImage: panel.image
    ? `url(${panel.image})`
    : `linear-gradient(160deg, ${panel.tone[0]} 0%, ${panel.tone[1]} 100%)`,
  backgroundSize: `${SLICES_PER_PANEL * 100}% 100%`,
  backgroundPosition: `${(slice / (SLICES_PER_PANEL - 1)) * 100}% 0`,
});

const toRad = (deg) => (deg * Math.PI) / 180;
const COS_X = Math.cos(toRad(TILT_X_DEG));
const SIN_X = Math.sin(toRad(TILT_X_DEG));
const COS_Z = Math.cos(toRad(TILT_Z_DEG));
const SIN_Z = Math.sin(toRad(TILT_Z_DEG));

// 4×4 행렬(행 우선, 16칸) 곱 — a × b
const multiply = (a, b) => {
  const out = new Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[row * 4 + col] =
        a[row * 4] * b[col] + a[row * 4 + 1] * b[4 + col] + a[row * 4 + 2] * b[8 + col] + a[row * 4 + 3] * b[12 + col];
    }
  }
  return out;
};

// 매 프레임 바뀌지 않는 앞부분: 원근(perspective) × rotateZ × rotateX — 길이 단위는 px (cqw를 px로 바꿔 받는다)
// 조각마다 CSS 문자열을 브라우저가 해석하지 않도록, 변환을 숫자 행렬(matrix3d)로 직접 만들어 준다
const fixedMatrix = (pxPerCqw) => {
  const perspective = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -1 / (PERSPECTIVE * pxPerCqw), 1];
  const rotateZ = [COS_Z, -SIN_Z, 0, 0, SIN_Z, COS_Z, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const rotateX = [1, 0, 0, 0, 0, COS_X, -SIN_X, 0, 0, SIN_X, COS_X, 0, 0, 0, 0, 1];
  return multiply(multiply(perspective, rotateZ), rotateX);
};

// 회전각(spin)일 때 조각 하나의 변환과 앞면 여부
// 조각 중심과 바깥쪽 방향을 CSS와 같은 순서(rotateY → rotateX → rotateZ)로 돌려 카메라 쪽을 보는지 계산한다
const placeSlice = (angle, spin, fixed, pxPerCqw) => {
  const a = angle + spin;
  const sin = Math.sin(toRad(a));
  const cos = Math.cos(toRad(a));

  // 조각 중심 (원기둥 둘레 위의 점)
  const x1 = RADIUS * sin;
  const y1 = -RADIUS * cos * SIN_X;
  const z = RADIUS * cos * COS_X;
  const x = x1 * COS_Z - y1 * SIN_Z;
  const y = x1 * SIN_Z + y1 * COS_Z;

  // 바깥쪽 방향
  const nx = sin * COS_Z + cos * SIN_X * SIN_Z;
  const ny = sin * SIN_Z - cos * SIN_X * COS_Z;
  const nz = cos * COS_X;

  // 조각에서 카메라(0, 0, PERSPECTIVE)로 가는 방향과 같은 쪽을 보면 앞면
  const isFront = nx * -x + ny * -y + nz * (PERSPECTIVE - z) > 0;

  // rotateY(a) × translateZ(RADIUS)
  const radius = RADIUS * pxPerCqw;
  const spinAndPush = [cos, 0, sin, sin * radius, 0, 1, 0, 0, -sin, 0, cos, cos * radius, 0, 0, 0, 1];
  const m = multiply(fixed, spinAndPush);

  return {
    // matrix3d는 열 우선이라 행 우선 배열을 뒤집어 넘긴다
    transform: `matrix3d(${m[0]},${m[4]},${m[8]},${m[12]},${m[1]},${m[5]},${m[9]},${m[13]},${m[2]},${m[6]},${m[10]},${m[14]},${m[3]},${m[7]},${m[11]},${m[15]})`,
    isFront,
  };
};

// 드래그로 직접 돌릴 수 있는 원기둥 — 손을 떼면 그 자리에서 다시 저절로 돈다
// 화면 밖에 있는 동안엔 프레임 계산을 멈춰 쉰다
const useDragSpin = () => {
  const bandRef = useRef(null);
  const sliceRefs = useRef([]);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const angleRef = useRef(0); // 지금 회전각(도)
  const pressedLinkRef = useRef(null); // 누르기 시작한 카드의 주소 (카드 밖이면 null)

  const probeRef = useRef(null); // 가로 100cqw인 보이지 않는 막대 — 1cqw가 몇 px인지 재는 용도
  const unitRef = useRef({ pxPerCqw: 0, fixed: null });

  // 지금 회전각대로 모든 조각의 위치·앞뒤를 맞춘다
  // 앞면 조각은 항상 뒷면 조각 위에 그리면 되므로, z-index는 앞뒤가 바뀔 때만 쓴다
  const render = () => {
    const { pxPerCqw, fixed } = unitRef.current;
    if (!fixed) return;
    SLICES.forEach((item, index) => {
      const el = sliceRefs.current[index];
      if (!el) return;
      const { transform, isFront } = placeSlice(item.angle, angleRef.current, fixed, pxPerCqw);
      el.style.transform = transform;
      const side = isFront ? 'front' : 'back';
      if (el.dataset.side !== side) {
        el.dataset.side = side;
        el.style.zIndex = isFront ? 1 : 0;
      }
    });
  };

  // 화면 크기가 바뀌면 cqw → px 비율을 다시 재고 다시 그린다 (첫 화면이 그려지기 전에도 한 번 놓는다)
  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return undefined;
    const measure = () => {
      // offsetWidth는 등장 연출의 확대·축소(scale)에 영향을 받지 않는다
      const pxPerCqw = probe.offsetWidth / 100;
      if (!pxPerCqw) return;
      unitRef.current = { pxPerCqw, fixed: fixedMatrix(pxPerCqw) };
      render();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(probe);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return undefined;
    let frame = 0;
    let last = 0;

    const tick = (now) => {
      const seconds = last ? Math.min((now - last) / 1000, MAX_FRAME_SECONDS) : 0;
      last = now;
      if (!draggingRef.current) angleRef.current += seconds * (360 / SPIN_SECONDS);
      render();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) frame = requestAnimationFrame(tick);
      if (!entry.isIntersecting) stop();
    });
    observer.observe(band);
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const onPointerDown = (event) => {
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startAngleRef.current = angleRef.current;
    // 포인터를 붙잡으면 손을 뗄 때의 대상이 바깥 상자로 바뀌므로, 누른 카드는 지금 기억해 둔다
    pressedLinkRef.current = event.target.closest('[data-link]')?.dataset.link ?? null;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - startXRef.current;
    if (Math.abs(dx) > CLICK_SLOP) pressedLinkRef.current = null; // 끌기 시작하면 클릭이 아니다
    angleRef.current = startAngleRef.current + dx * DRAG_SENSITIVITY;
  };
  const endDrag = () => {
    draggingRef.current = false; // 놓은 각도에서 다시 저절로 돈다
    pressedLinkRef.current = null;
  };
  const onPointerUp = () => {
    const link = pressedLinkRef.current;
    endDrag();
    if (link) openLink(link);
  };

  return {
    bandRef,
    probeRef,
    sliceRefs,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: endDrag },
  };
};

const faceSx = {
  position: 'absolute',
  inset: 0,
};

const RibbonBand = ({ sx = {} }) => {
  const { bandRef, probeRef, sliceRefs, dragHandlers } = useDragSpin();

  return (
    <Box
      aria-hidden
      {...dragHandlers}
      sx={{
        cursor: 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
        '&:active, &:active *': { cursor: 'grabbing' },
        ...sx,
      }}
    >
      {/* 위아래로 둥실 떠 있는 움직임 — 조각마다 원근을 따로 주므로 바깥 상자는 2D 이동만 한다 */}
      <Box
        ref={bandRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          isolation: 'isolate',
          animation: 'float 6s ease-in-out infinite',
        }}
      >
        {/* 1cqw가 몇 px인지 재는 보이지 않는 막대 */}
        <Box ref={probeRef} sx={{ position: 'absolute', left: 0, top: 0, width: '100cqw', height: 0, visibility: 'hidden' }} />
        {SLICES.map((item, index) => (
          <Box
            key={item.key}
            ref={(el) => {
              sliceRefs.current[index] = el;
            }}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${SLICE_WIDTH}cqw`,
              height: `${BAND_HEIGHT}cqw`,
              ml: `${-SLICE_WIDTH / 2}cqw`,
              mt: `${-BAND_HEIGHT / 2}cqw`,
              // 조각마다 따로 그래픽 레이어로 올려 두면, 움직일 때 다시 그리지 않고 위치만 옮긴다
              willChange: 'transform',
              // 앞면 조각은 카드 이미지, 뒷면 조각(원기둥 안쪽 벽)은 연회색 — 둘 중 하나만 보인다
              '&[data-side="back"] .ribbonOuter': { visibility: 'hidden' },
              '&:not([data-side="back"]) .ribbonInner': { visibility: 'hidden' },
            }}
          >
            {/* 바깥면: 카드 이미지 */}
            <Box
              className="ribbonOuter"
              data-link={item.panel.link}
              sx={{ ...faceSx, ...outerBackground(item), cursor: 'pointer' }}
            />
            {/* 안쪽면: 연회색 벽 */}
            <Box className="ribbonInner" sx={{ ...faceSx, bgcolor: '#ebebeb' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RibbonBand;
