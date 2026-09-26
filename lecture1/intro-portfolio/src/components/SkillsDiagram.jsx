import { useEffect, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';

// 스킬 방사형 다이어그램 (참고: seunghyuk.com 메인 화면의 동작을 분석해 옮김)
// - 글자·선 끝은 제자리에 있고, 가운데 사각형만 마우스 쪽으로 스프링처럼 따라가 선들이 흔들린다
// - 선 끝은 각자 사인파로 살랑이고, 커서 쪽으로 살짝 기울며, 마우스를 빠르게 움직이면 관성으로 끌려온다
// - 커서가 선에 닿으면 그 부분만 작은 입자로 부서졌다가 멀어지면 다시 이어진다 (가끔 저절로 부서지기도 한다)
// - 가장 가까운 선은 가운데에서부터 진한 선이 차오르고, 글자가 진해지며 커서 쪽으로 살짝 끌린다
// - 커서가 사각형에 가까워지면 사각형이 커지며 "WHO AM I ?"가 나타나고, 움직일 땐 진행 방향으로 늘어난다
// 모든 좌표는 시안 viewBox(2000 × 1026) 단위로 계산하고, 캔버스에 맞춰 축소·확대해 그린다.

const VIEW_W = 2000;
const VIEW_H = 1026;
const U = 1.4; // 참고 사이트의 px 값을 viewBox 단위로 바꾸는 비율 (1440px 화면 ≒ 2000 단위)

// 가운데 사각형
const SQUARE_SIZE = 18;
const SQUARE_HOVER_SIZE = 150;
const SQUARE_HOVER_RADIUS = 185 * U; // 이 안에 커서가 오면 커진다
const SQUARE_FOLLOW = [72 * U, 70 * U]; // 커서가 끝에 있을 때 따라가는 최대 거리
const SQUARE_LABEL = 'WHO AM I ?';

// 선
const HOVER_RADIUS = 95 * U; // 가장 가까운 선 강조 거리
const HOVER_IN_MS = 225;
const HOVER_OUT_MS = 250;
const CONTACT_RADIUS = 70 * U; // 이 안이면 선이 입자로 부서진다
const PARTICLE_GAP = 6 * U;
const ATTRACT_RANGE = 750 * U; // 선 끝이 커서 쪽으로 기우는 범위
const ATTRACT_MAX = 100 * U;
const STRAY_EVERY_MS = [6000, 9000]; // 가끔 저절로 부서지는 간격
// 선 굵기·색 — 머리카락처럼 가는 선으로 섬세하게
const LINE_STYLE = {
  main: { width: 1.3, color: 'rgba(110, 110, 110, 0.9)' }, // 주요 툴: 회색
  sub: { width: 0.9, color: 'rgba(0, 0, 0, 0.3)' }, // 세부 스킬: 옅은 회색
};
const GHOST_COUNT = 24; // 배경 선 개수
const GRID_GAP = 60 * U; // 배경 격자 간격

// 커서
const CURSOR_FRAME_FOLLOW = 0.18; // 네모 테두리가 따라오는 속도 (작을수록 느긋하게)
const CURSOR_DOT_REACH = 1.2; // 안쪽 점이 움직이는 방향으로 쏠리는 정도
const CURSOR_DOT_RADIUS = 2.6;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut3 = (t) => 1 - (1 - clamp01(t)) ** 3;
const easeOut4 = (t) => 1 - (1 - clamp01(t)) ** 4;
const smootherstep = (t) => {
  const x = clamp01(t);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(ax + t * dx - px, ay + t * dy - py);
};

// 매번 같은 모양이 나오도록 시드 고정 난수
const createRandom = (seed) => {
  let s = seed;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
};

const SkillsDiagram = ({ skills, center, subColor, titleSize, subSize }) => {
  const canvasRef = useRef(null);

  // 선마다 움직임 성격(흔들림 크기·속도, 커서를 따라가는 정도, 등장 타이밍)을 정해 둔다
  const lines = useMemo(() => {
    const rand = createRandom(987654321);
    // 배경 선: 글자 없이 옅고 가는 선들이 사이사이를 채워 깊이감을 준다 (가로로 넓은 타원 위에 흩뿌림)
    const ghosts = Array.from({ length: GHOST_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / GHOST_COUNT + (rand() - 0.5) * 0.5;
      const length = 130 + rand() * 320;
      return {
        title: null,
        isGhost: true,
        line: [center.x + Math.cos(angle) * length * 1.26, center.y + Math.sin(angle) * length * 0.65],
        width: 0.6 + rand() * 0.45,
        alpha: 0.08 + rand() * 0.14,
      };
    });
    const nodes = [
      ...ghosts,
      ...skills.flatMap((skill) => skill.subs).map((sub) => ({ ...sub, isSub: true })),
      ...skills.map((skill) => ({ ...skill, isSub: false })),
    ];
    return nodes.map((node) => {
      const dx = node.line[0] - center.x;
      const dy = node.line[1] - center.y;
      const len = Math.hypot(dx, dy) || 1;
      let width = LINE_STYLE.main.width;
      let color = LINE_STYLE.main.color;
      if (node.isGhost) {
        width = node.width;
        color = `rgba(0, 0, 0, ${node.alpha.toFixed(3)})`;
      } else if (node.isSub) {
        width = LINE_STYLE.sub.width;
        color = LINE_STYLE.sub.color;
      }
      return {
        ...node,
        fixed: { x: node.line[0], y: node.line[1] },
        labelOffset: node.label ? { x: node.label[0] - node.line[0], y: node.label[1] - node.line[1] } : null,
        dirCos: dx / len,
        dirSin: dy / len,
        width,
        color,
        amplitude: 0.6 + rand() * 0.78,
        frequency: 0.08 + rand() * 0.15,
        phase: Math.atan2(dy, dx) * 1.5 + rand() * 0.6,
        follow: 0.05 + rand() * 0.18 + (rand() < 0.27 ? 0.8 + rand() * 1.2 : 0),
        breathPhase: rand() * Math.PI * 2,
        breathFreq: 0.05 + rand() * 0.08,
        enterDelay: rand() * 300,
        enterDuration: 450 + rand() * 250,
        hover: 0,
        parts: null,
        wasNear: false,
      };
    });
  }, [skills, center]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const subRgb = parseInt(subColor.slice(1, 3), 16);

    // 캔버스 크기와 viewBox → 캔버스 변환
    const view = { w: 0, h: 0, scale: 1, ox: 0, oy: 0, dpr: 1 };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = rect.width;
      view.h = rect.height;
      view.scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      view.ox = (rect.width - VIEW_W * view.scale) / 2;
      view.oy = (rect.height - VIEW_H * view.scale) / 2;
      canvas.width = Math.round(rect.width * view.dpr);
      canvas.height = Math.round(rect.height * view.dpr);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const mouse = { x: center.x, y: center.y, on: false };
    const cursor = { x: center.x, y: center.y };
    const prevMouse = { x: center.x, y: center.y };
    const square = { x: center.x, y: center.y, vx: 0, vy: 0 };
    const drag = { x: 0, y: 0 }; // 마우스 움직임의 관성
    const parallax = { x: 0, y: 0 };
    const cursorDot = { x: 0, y: 0 }; // 커서 안쪽 점의 쏠림
    let cursorSize = 9;
    let squareHover = 0;
    let enterStart = null;
    let nextStray = performance.now() + STRAY_EVERY_MS[0];
    let visible = false;
    let frame = 0;
    let last = performance.now();

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left - view.ox) / view.scale;
      mouse.y = (e.clientY - rect.top - view.oy) / view.scale;
      if (!mouse.on) {
        cursor.x = mouse.x;
        cursor.y = mouse.y;
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;
      }
      mouse.on = true;
    };
    const handleLeave = () => {
      mouse.on = false;
    };
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerleave', handleLeave);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (entry.intersectionRatio > 0.4 && enterStart === null) {
          enterStart = reduceMotion ? -Infinity : performance.now();
        }
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(canvas);

    const makeParts = (count) =>
      Array.from({ length: count }, () => ({ ox: 0, oy: 0, vx: 0, vy: 0, release: 0, stray: 0 }));

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last);
      last = now;
      if (!visible) return;
      const t = now * 0.001;

      // ── 가운데 사각형: 커서 쪽 목표점으로 스프링 이동 ──
      let tx = center.x;
      let ty = center.y;
      if (mouse.on) {
        tx += Math.max(-1, Math.min(1, (mouse.x - center.x) / (VIEW_W / 2))) * SQUARE_FOLLOW[0];
        ty += Math.max(-1, Math.min(1, (mouse.y - center.y) / (VIEW_H / 2))) * SQUARE_FOLLOW[1];
      }
      const stiffness = lerp(0.018, 0.058, clamp01(1 - Math.hypot(tx - square.x, ty - square.y) / (90 * U)));
      square.vx = (square.vx + (tx - square.x) * stiffness) * 0.94;
      square.vy = (square.vy + (ty - square.y) * stiffness) * 0.94;
      square.x += square.vx;
      square.y += square.vy;

      // 커서가 사각형에 가까우면 커진다 (커질 땐 빠르게, 작아질 땐 천천히)
      const squareDist = Math.hypot(mouse.x - square.x, mouse.y - square.y);
      const hoverTarget = mouse.on && !reduceMotion ? smootherstep(1 - squareDist / SQUARE_HOVER_RADIUS) : 0;
      squareHover += (hoverTarget - squareHover) * (1 - Math.exp(-dt / (hoverTarget > squareHover ? 75 : 120)));
      const squareSize = lerp(SQUARE_SIZE, SQUARE_HOVER_SIZE, easeOut3(squareHover));
      const half = squareSize / 2;

      // 마우스 움직임 관성 — 빠르게 움직이면 선 끝이 끌려왔다가 돌아간다
      let mdx = mouse.on ? mouse.x - prevMouse.x : 0;
      let mdy = mouse.on ? mouse.y - prevMouse.y : 0;
      mdx = Math.max(-140 * U, Math.min(140 * U, mdx));
      mdy = Math.max(-140 * U, Math.min(140 * U, mdy));
      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;
      drag.x = drag.x * 0.9 + mdx * 0.55;
      drag.y = drag.y * 0.9 + mdy * 0.55;
      const dragLen = Math.hypot(drag.x, drag.y);
      if (dragLen > 320 * U) {
        drag.x = (drag.x / dragLen) * 320 * U;
        drag.y = (drag.y / dragLen) * 320 * U;
      }

      // 글자 패럴랙스 (커서 반대쪽으로 아주 살짝)
      const px = mouse.on ? -Math.max(-1, Math.min(1, (mouse.x - center.x) / (VIEW_W / 2))) * 4 * U : 0;
      const py = mouse.on ? -Math.max(-1, Math.min(1, (mouse.y - center.y) / (VIEW_H / 2))) * 4 * U : 0;
      parallax.x += (px - parallax.x) * 0.05;
      parallax.y += (py - parallax.y) * 0.05;

      // 커서: 네모 테두리는 살짝 늦게 따라오고, 안쪽 점은 실제 마우스 위치 쪽으로 쏠린다
      cursor.x += (mouse.x - cursor.x) * CURSOR_FRAME_FOLLOW;
      cursor.y += (mouse.y - cursor.y) * CURSOR_FRAME_FOLLOW;

      // 커서와 가장 가까운 선
      let hovered = -1;
      if (mouse.on) {
        let best = HOVER_RADIUS;
        lines.forEach((line, i) => {
          if (line.isGhost) return; // 배경 선은 강조하지 않는다
          const d = distToSegment(mouse.x, mouse.y, square.x, square.y, line.fixed.x, line.fixed.y);
          if (d < best) {
            best = d;
            hovered = i;
          }
        });
      }

      // 가끔 아무 선이나 조금 부서졌다 돌아온다
      if (!reduceMotion && now > nextStray) {
        const line = lines[Math.floor(Math.random() * lines.length)];
        const len = Math.hypot(line.fixed.x - center.x, line.fixed.y - center.y);
        if (!line.parts) line.parts = makeParts(Math.max(3, Math.ceil(len / PARTICLE_GAP)));
        const count = 1 + (Math.random() < 0.5 ? 1 : 0);
        for (let k = 0; k < count; k += 1) {
          line.parts[Math.floor(Math.random() * line.parts.length)].stray = now + 1200 + Math.random() * 500;
        }
        nextStray = now + lerp(STRAY_EVERY_MS[0], STRAY_EVERY_MS[1], Math.random());
      }

      // ── 그리기 ──
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.clearRect(0, 0, view.w, view.h);

      // 아주 옅은 배경 격자 — 가운데 사각형을 기준으로 화면 끝까지 깐다
      const gap = GRID_GAP * view.scale;
      const gx = view.ox + center.x * view.scale;
      const gy = view.oy + center.y * view.scale;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.055)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = gx % gap; x <= view.w; x += gap) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, view.h);
      }
      for (let y = gy % gap; y <= view.h; y += gap) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(view.w, Math.round(y) + 0.5);
      }
      ctx.stroke();

      ctx.setTransform(
        view.dpr * view.scale,
        0,
        0,
        view.dpr * view.scale,
        view.dpr * view.ox,
        view.dpr * view.oy,
      );
      ctx.lineCap = 'butt';

      lines.forEach((line, i) => {
        // 선이 사각형 가장자리에서 시작하도록
        const cx = line.fixed.x - square.x;
        const cy = line.fixed.y - square.y;
        const cl = Math.hypot(cx, cy) || 1;
        const hx = cx / cl;
        const hy = cy / cl;
        const edge = Math.min(half / (Math.abs(hx) + 1e-6), half / (Math.abs(hy) + 1e-6));
        const sx = square.x + hx * edge;
        const sy = square.y + hy * edge;

        // 선 끝: 사인파 흔들림 + 관성 + 커서 끌림 + 숨쉬기 + 패럴랙스
        const motion = reduceMotion ? 0 : 1;
        const wave =
          (Math.sin(t * line.frequency * Math.PI * 2 + line.phase) +
            Math.sin(t * line.frequency * 3.3 * Math.PI * 2 + line.phase * 1.6 + 0.7) * 0.28) *
          line.amplitude *
          10 *
          U *
          motion;
        const along =
          Math.sin(t * line.frequency * 1.3 * Math.PI * 2 + line.phase + 1.1) * line.amplitude * 4.5 * U * motion;
        let ax = 0;
        let ay = 0;
        if (mouse.on) {
          const ex = mouse.x - line.fixed.x;
          const ey = mouse.y - line.fixed.y;
          const r = Math.hypot(ex, ey) || 1;
          const reach = clamp01(1 - r / ATTRACT_RANGE);
          const near = clamp01(r / (130 * U));
          const strength = reach * reach * near * near * (3 - 2 * near) * ATTRACT_MAX;
          ax = (ex / r) * strength;
          ay = (ey / r) * strength;
        }
        const bx = Math.sin(t * line.breathFreq * Math.PI * 2 + line.breathPhase) * 1.5 * U * motion;
        const by = Math.cos(t * line.breathFreq * 0.83 * Math.PI * 2 + line.breathPhase * 1.7) * 1.5 * U * motion;
        const ex =
          line.fixed.x - line.dirSin * wave + line.dirCos * along + drag.x * line.follow + ax + bx + parallax.x;
        const ey =
          line.fixed.y + line.dirCos * wave + line.dirSin * along + drag.y * line.follow + ay + by + parallax.y;

        // 등장: 사각형에서 선이 뻗어 나간다
        const enter =
          enterStart === null ? 0 : easeOut4((now - enterStart - line.enterDelay) / line.enterDuration);
        if (enter <= 0.001) return;
        const lx = sx + (ex - sx) * enter;
        const ly = sy + (ey - sy) * enter;
        const vx = lx - sx;
        const vy = ly - sy;
        const len = Math.hypot(vx, vy) || 1;

        // 강조 정도 (들어올 땐 225ms, 나갈 땐 250ms)
        const target = i === hovered ? 1 : 0;
        line.hover += target > line.hover ? Math.min(target - line.hover, dt / HOVER_IN_MS) : Math.max(target - line.hover, -dt / HOVER_OUT_MS);
        const hover = easeOut3(line.hover);

        // 커서가 닿은 부분은 입자로 부서진다
        let broken = false;
        if (!reduceMotion && enter >= 0.999) {
          const near = mouse.on && distToSegment(mouse.x, mouse.y, sx, sy, lx, ly) < CONTACT_RADIUS;
          if (near && !line.parts) line.parts = makeParts(Math.max(3, Math.ceil(len / PARTICLE_GAP)));
          if (line.parts) {
            const parts = line.parts;
            const n = parts.length;
            // 커서가 떠나면 가까운 입자부터 차례로 제자리로
            if (line.wasNear && !near) {
              const proj = clamp01(((mouse.x - sx) * vx + (mouse.y - sy) * vy) / (len * len));
              parts.forEach((part, k) => {
                const d = Math.abs(k / (n - 1) - proj) * len;
                part.release = now + (1 - clamp01(d / (320 * U))) * 300;
              });
            }
            line.wasNear = near;
            let maxOffset = 0;
            let straying = false;
            parts.forEach((part, k) => {
              const u = k / (n - 1);
              const bxp = sx + vx * u;
              const byp = sy + vy * u;
              let goalX = 0;
              let goalY = 0;
              let spring = 0.16;
              let damping = 0.78;
              if (part.stray > now) {
                straying = true;
                goalX = Math.sin(now * 0.0011 + k * 1.7) * 4 * U;
                goalY = Math.cos(now * 0.0009 + k * 2.3) * 4 * U;
                spring = 0.04;
                damping = 0.9;
              } else if (near) {
                const dx = bxp - mouse.x;
                const dy = byp - mouse.y;
                const d = Math.hypot(dx, dy) || 1;
                const falloff = Math.exp(-(d * d) / (2 * (120 * U) ** 2));
                if (d < CONTACT_RADIUS) {
                  goalX = (Math.sin(now * 0.0013 + k * 1.7) * 6 + (dx / d) * 9) * U * falloff;
                  goalY = (Math.cos(now * 0.0011 + k * 2.3) * 6 + (dy / d) * 9) * U * falloff;
                  spring = 0.05;
                  damping = 0.86;
                } else {
                  goalX = Math.sin(now * 0.004 + k * 3.1) * 1.1 * U * falloff;
                  goalY = Math.cos(now * 0.0035 + k * 2.6) * 1.1 * U * falloff;
                  spring = 0.08;
                  damping = 0.84;
                }
                part.release = 0;
              } else if (part.release > now) {
                goalX = part.ox;
                goalY = part.oy;
                spring = 0.03;
                damping = 0.92;
              }
              part.vx = (part.vx + (goalX - part.ox) * spring) * damping;
              part.vy = (part.vy + (goalY - part.oy) * spring) * damping;
              part.ox += part.vx;
              part.oy += part.vy;
              maxOffset = Math.max(maxOffset, Math.abs(part.ox) + Math.abs(part.oy));
            });
            if (!near && maxOffset < 0.05 && !straying) line.parts = null;
            else broken = true;
          }
        } else {
          line.parts = null;
        }

        // 선(또는 부서진 선) 그리기 — upTo: 선의 어디까지 그릴지 (0~1)
        const drawLine = (color, width, upTo) => {
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = width;
          if (!broken) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + vx * upTo, sy + vy * upTo);
            ctx.stroke();
            return;
          }
          const parts = line.parts;
          const n = parts.length;
          const moved = (p) => Math.abs(p.ox) + Math.abs(p.oy) > 0.45 * U;
          // 제자리에 있는 입자들은 이어진 선으로
          ctx.beginPath();
          let runStart = -1;
          for (let k = 0; k < n; k += 1) {
            const isMoved = moved(parts[k]);
            if (!isMoved && runStart < 0) runStart = k;
            if (runStart >= 0 && (isMoved || k === n - 1)) {
              const a = runStart / (n - 1);
              const b = Math.min((isMoved ? k - 1 : k) / (n - 1), upTo);
              if (b > a) {
                ctx.moveTo(sx + vx * a, sy + vy * a);
                ctx.lineTo(sx + vx * b, sy + vy * b);
              }
              runStart = -1;
            }
          }
          ctx.stroke();
          // 흩어진 입자들은 점으로
          ctx.beginPath();
          for (let k = 0; k < n; k += 1) {
            const p = parts[k];
            const u = k / (n - 1);
            if (u > upTo) break;
            if (!moved(p)) continue;
            const x = sx + vx * u + p.ox;
            const y = sy + vy * u + p.oy;
            ctx.moveTo(x + 0.9 * U, y);
            ctx.arc(x, y, 0.9 * U, 0, Math.PI * 2);
          }
          ctx.fill();
        };

        drawLine(line.color, line.width, 1);
        // 강조: 가운데에서부터 진한 선이 차오른다
        if (hover > 0.01) drawLine('rgba(10, 10, 10, 0.88)', line.width + 0.45 * U, hover);

        // 글자
        if (line.title && enter >= 0.999) {
          const labelIn = enterStart === null ? 0 : clamp01((now - enterStart - line.enterDelay - line.enterDuration) / 250);
          let tx2 = lx + line.labelOffset.x + parallax.x * 0.5;
          let ty2 = ly + line.labelOffset.y + parallax.y * 0.5;
          if (hover > 0.01 && mouse.on) {
            const dx = mouse.x - tx2;
            const dy = mouse.y - ty2;
            const d = Math.hypot(dx, dy) || 1;
            tx2 += (dx / d) * 3 * U * hover;
            ty2 += (dy / d) * 3 * U * hover;
          }
          const base = line.isSub ? subRgb : 17;
          const shade = Math.round(lerp(base, 10, hover));
          const size = line.isSub ? subSize : titleSize;
          ctx.font = `600 ${size}px "Alumni Sans", sans-serif`;
          if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * -0.02}px`;
          ctx.textAlign = line.anchor === 'start' ? 'left' : line.anchor === 'end' ? 'right' : 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${labelIn})`;
          ctx.fillText(line.title, tx2, ty2);
        }
      });

      // 가운데 사각형 — 움직이는 방향으로 늘어나고 옆으로는 살짝 줄어든다
      ctx.fillStyle = '#000000';
      const speed = Math.hypot(square.vx, square.vy);
      const stretch = Math.min(speed * 0.02, 0.3) * (1 - easeOut3(squareHover));
      if (speed > 0.01 && stretch > 0.0005) {
        const ux = square.vx / speed;
        const uy = square.vy / speed;
        const along = 1 + stretch;
        const across = 1 - stretch * 0.6;
        ctx.save();
        ctx.translate(square.x, square.y);
        ctx.transform(
          along * ux * ux + across * uy * uy,
          (along - across) * ux * uy,
          (along - across) * ux * uy,
          along * uy * uy + across * ux * ux,
          0,
          0,
        );
        ctx.fillRect(-half, -half, squareSize, squareSize);
        ctx.restore();
      } else {
        ctx.fillRect(square.x - half, square.y - half, squareSize, squareSize);
      }
      const labelAlpha = smootherstep((squareHover - 0.28) / 0.62);
      if (labelAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = labelAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.font = '400 30px "Anton", sans-serif';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.6px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(SQUARE_LABEL, square.x, square.y);
        ctx.restore();
      }

      // 네모 커서 — 선이나 사각형 위에선 조금 커지고, 안쪽 점은 움직이는 방향으로 쏠린다
      if (mouse.on) {
        const active = hovered >= 0 || squareHover > 0.3;
        cursorSize += ((active ? 26 : 18) / 2 - cursorSize) * 0.2;
        const limit = cursorSize - CURSOR_DOT_RADIUS - 1.5; // 점이 테두리 밖으로 나가지 않게
        const offX = Math.max(-limit, Math.min(limit, (mouse.x - cursor.x) * CURSOR_DOT_REACH));
        const offY = Math.max(-limit, Math.min(limit, (mouse.y - cursor.y) * CURSOR_DOT_REACH));
        cursorDot.x += (offX - cursorDot.x) * 0.35;
        cursorDot.y += (offY - cursorDot.y) * 0.35;

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cursor.x - cursorSize, cursor.y - cursorSize, cursorSize * 2, cursorSize * 2);
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(cursor.x + cursorDot.x, cursor.y + cursorDot.y, CURSOR_DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerleave', handleLeave);
    };
  }, [lines, center, subColor, titleSize, subSize]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-label="스킬 다이어그램"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: '100%',
        height: '100%',
        cursor: 'none',
        touchAction: 'pan-y',
      }}
    />
  );
};

export default SkillsDiagram;
