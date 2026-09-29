import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { dpx } from '../../constants/typography';
import { aboutTextSx } from '../about-me/aboutMeStyles';

// 넘겨 보는 책자 — 프로젝트 상세 01 무대(1440 × 784) 안에 시안 px 좌표로 놓인다
// · 오른쪽/왼쪽 아래 접힌 모서리나 아래 화살표를 누르면 종이가 3D로 넘어간다
// · 그림에 커서를 올리면(키보드는 Tab으로 초점) 종이 위로 들려 올라오며 확대된다
// book(projectDetails.js): spineX(책등 x), top(종이 윗변 y), page({ w, h }), pages(짝수 장)
//   pages 한 장: { src, alt, title } — src가 없으면 { title, lines }로 글만 있는 맺음 페이지가 된다
//
// 책 구조 (8쪽 기준)
//   왼쪽 바닥 페이지: 1쪽 | 넘기는 종이 0: 앞 2쪽 / 뒤 3쪽
//                        | 넘기는 종이 1: 앞 4쪽 / 뒤 5쪽
//                        | 넘기는 종이 2: 앞 6쪽 / 뒤 7쪽
//                        | 오른쪽 바닥 페이지: 8쪽
//   → 펼침면은 [1|2] → [3|4] → [5|6] → [7|8]

export const COVER_PAD = 10; // 종이 바깥으로 보이는 표지 두께
const PAGE_PAD = 24; // 종이 안쪽 여백
const CAPTION_H = 64; // 그림 아래 제목·쪽 번호 자리
const ZOOM = 1.35; // 커서를 올렸을 때 그림 확대 배율
const TURN_MS = 1100; // 한 장 넘어가는 시간
const TURN_STAGGER_MS = 90; // 여러 장을 한 번에 넘길 때 장 사이 간격
const CORNER = 56; // 접힌 모서리 버튼 크기

const PAPER = '#f1ebdf';
const INK = '#1d1d1b';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TURN_EASE = 'cubic-bezier(0.645, 0.045, 0.355, 1)'; // 천천히 들렸다가 → 빠르게 넘어가고 → 사뿐히 내려앉는다
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

const pad2 = (n) => String(n).padStart(2, '0');

// 종이 크기 → 한 쪽 높이 (정사각형 그림 + 아래 제목 자리)
const pageHeight =(pageWidth) => pageWidth + CAPTION_H;

// 책등 쪽이 살짝 어둡게 말려 들어가 보이는 그림자 — side: 이 쪽이 책의 왼쪽/오른쪽 중 어디인지
const gutterShadow = (side) =>
  `linear-gradient(to ${side === 'left' ? 'left' : 'right'}, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.06) 7%, transparent 16%)`;

// 쪽 아래 가운데 쪽 번호
const Folio = ({ index, side }) => (
  <Typography
    sx={{
      ...aboutTextSx,
      position: 'absolute',
      bottom: dpx(12),
      [side]: dpx(PAGE_PAD),
      color: '#a39c8e',
      fontWeight: 400,
      fontSize: dpx(10),
      letterSpacing: '0.2em',
    }}
  >
    — {pad2(index + 1)} —
  </Typography>
);

// 종이 한 쪽 — 그림 + 제목, 또는 글만 있는 맺음 페이지
const BookPage = ({ page, index, side, imageSize, isZoomed, onZoomChange, sx = {} }) => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      p: dpx(PAGE_PAD),
      bgcolor: PAPER,
      backgroundImage: gutterShadow(side),
      ...sx,
    }}
  >
    {page.src ? (
      <>
        <Box
          component="img"
          src={page.src}
          alt={page.alt}
          tabIndex={0}
          onMouseEnter={() => onZoomChange(index)}
          onMouseLeave={() => onZoomChange(null)}
          onFocus={() => onZoomChange(index)}
          onBlur={() => onZoomChange(null)}
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'block',
            width: dpx(imageSize),
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            cursor: 'zoom-in',
            outline: 'none',
            // 들려 올라올 때 책 바깥쪽으로 살짝 기울어 손으로 집어 든 느낌을 준다
            transform: isZoomed ? `scale(${ZOOM}) rotate(${side === 'left' ? -1.5 : 1.5}deg)` : 'none',
            boxShadow: isZoomed
              ? `0 ${dpx(28)} ${dpx(60)} rgba(0, 0, 0, 0.5), 0 0 0 ${dpx(6)} #ffffff`
              : '0 0 0 1px rgba(0, 0, 0, 0.08)',
            transition: `transform 0.55s ${EASE}, box-shadow 0.55s ${EASE}`,
            [REDUCED_MOTION]: { transition: 'none' },
          }}
        />
        <Box sx={{ mt: dpx(12), display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography sx={{ ...aboutTextSx, color: INK, fontSize: dpx(19), letterSpacing: '0.01em' }}>
            {page.title}
          </Typography>
          <Typography sx={{ ...aboutTextSx, color: '#8a8478', fontWeight: 400, fontSize: dpx(12) }}>
            No.{pad2(index + 1)}
          </Typography>
        </Box>
      </>
    ) : (
      // 맺음 페이지 — 책 마지막 쪽에 제목과 짧은 글
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: INK,
        }}
      >
        <Typography sx={{ ...aboutTextSx, color: INK, fontFamily: '"Anton", sans-serif', fontWeight: 400, fontSize: dpx(56) }}>
          {page.title}
        </Typography>
        {page.lines.map((line) => (
          <Typography
            key={line}
            sx={{ ...aboutTextSx, mt: dpx(10), color: '#6f6a60', fontWeight: 400, fontSize: dpx(13), letterSpacing: '0.2em' }}
          >
            {line}
          </Typography>
        ))}
      </Box>
    )}
    <Folio index={index} side={side} />
  </Box>
);

const ArchiveBook = ({ book, sx = {} }) => {
  const { pages, spineX, top, page: pageSize } = book;
  const pageW = pageSize.w;
  const pageH = pageHeight(pageW);
  const imageSize = pageW - PAGE_PAD * 2;
  const bookLeft = spineX - pageW;
  const spreadCount = pages.length / 2;
  const leafCount = spreadCount - 1;

  const [spread, setSpread] = useState(0); // 지금 펼쳐진 면 (0부터)
  const [moving, setMoving] = useState(null); // 넘어가는 중인 종이 범위 { from, to } (to는 포함하지 않음)
  const [zoomedIndex, setZoomedIndex] = useState(null); // 확대 중인 쪽 번호
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const goTo = (next) => {
    if (next === spread || next < 0 || next >= spreadCount) return;
    const from = Math.min(spread, next);
    const to = Math.max(spread, next);
    setZoomedIndex(null);
    setMoving({ from, to });
    setSpread(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMoving(null), TURN_MS + (to - from - 1) * TURN_STAGGER_MS);
  };

  // 쪽 번호 → 그 쪽이 붙어 있는 넘기는 종이 (바닥 페이지면 null)
  const leafOf = (index) => (index === 0 || index === pages.length - 1 ? null : Math.floor((index - 1) / 2));
  const zoomedLeaf = zoomedIndex === null ? null : leafOf(zoomedIndex);

  // 종이 겹치는 순서 — 넘어가는 중인 종이가 맨 위, 확대 중인 종이가 그다음,
  // 나머지는 오른쪽 더미는 앞 장이 위, 왼쪽 더미는 나중에 넘긴 장이 위
  const leafZ = (i) => {
    if (moving && i >= moving.from && i < moving.to) return 50;
    if (zoomedLeaf === i) return 40;
    return i < spread ? 10 + i : 10 + (leafCount - i);
  };
  const baseZ = (index) => (zoomedIndex === index ? 40 : 1);

  const pageProps = (index, side) => ({
    page: pages[index],
    index,
    side,
    imageSize,
    isZoomed: zoomedIndex === index,
    onZoomChange: setZoomedIndex,
  });

  const pageBoxSx = (left) => ({
    position: 'absolute',
    left: dpx(left),
    top: dpx(top),
    width: dpx(pageW),
    height: dpx(pageH),
  });

  const coverSx = {
    position: 'absolute',
    left: dpx(bookLeft - COVER_PAD),
    top: dpx(top - COVER_PAD),
    width: dpx(pageW * 2 + COVER_PAD * 2),
    height: dpx(pageH + COVER_PAD * 2),
  };

  return (
    // 감싼 상자는 무대 전체를 덮으므로 클릭을 통과시키고, 책 요소만 눌리게 한다
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        '& > :not([aria-hidden])': { pointerEvents: 'auto' },
        ...sx,
      }}
    >
      {/* 표지 */}
      <Box
        aria-hidden
        sx={{ ...coverSx, bgcolor: '#2b2824', borderRadius: dpx(4), boxShadow: `0 ${dpx(22)} ${dpx(50)} rgba(0, 0, 0, 0.55)` }}
      />

      {/* 바닥 페이지 — 바깥쪽으로 겹겹이 보이는 종이 단면이 책의 두께를 만든다 */}
      <Box sx={{ ...pageBoxSx(bookLeft), zIndex: baseZ(0), boxShadow: `-${dpx(3)} 0 0 #dcd4c4, -${dpx(6)} 0 0 #c8bfad` }}>
        <BookPage {...pageProps(0, 'left')} />
      </Box>
      <Box
        sx={{
          ...pageBoxSx(spineX),
          zIndex: baseZ(pages.length - 1),
          boxShadow: `${dpx(3)} 0 0 #dcd4c4, ${dpx(6)} 0 0 #c8bfad`,
        }}
      >
        <BookPage {...pageProps(pages.length - 1, 'right')} />
      </Box>

      {/* 넘기는 종이 — 책등을 축으로 -180°까지 돌아 왼쪽으로 넘어간다. 앞면=오른쪽 쪽, 뒷면=왼쪽 쪽 */}
      {Array.from({ length: leafCount }, (_, i) => {
        const isTurned = i < spread;
        const isMoving = moving && i >= moving.from && i < moving.to;
        // 앞으로 넘길 땐 앞 장부터, 뒤로 넘길 땐 뒤 장부터 차례로 출발한다
        const order = isMoving ? (isTurned ? i - moving.from : moving.to - 1 - i) : 0;
        return (
          <Box
            key={i}
            sx={{
              ...pageBoxSx(spineX),
              zIndex: leafZ(i),
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transform: `perspective(${dpx(2200)}) rotateY(${isTurned ? -180 : 0}deg)`,
              transition: `transform ${TURN_MS}ms ${TURN_EASE} ${order * TURN_STAGGER_MS}ms`,
              [REDUCED_MOTION]: { transition: 'none' },
            }}
          >
            {/* 뒤집혀 안 보이는 면도 브라우저는 커서가 닿은 것으로 치므로, 지금 보이는 면만 커서에 반응하게 한다 */}
            <BookPage
              {...pageProps(i * 2 + 1, 'right')}
              sx={{ backfaceVisibility: 'hidden', pointerEvents: isTurned ? 'none' : 'auto' }}
            />
            <BookPage
              {...pageProps(i * 2 + 2, 'left')}
              sx={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: isTurned ? 'auto' : 'none' }}
            />
          </Box>
        );
      })}

      {/* 확대 중엔 책 전체를 살짝 어둡게 눌러 들려 올라온 그림에 시선이 가게 한다 */}
      <Box
        aria-hidden
        sx={{
          ...coverSx,
          zIndex: 35,
          bgcolor: 'rgba(0, 0, 0, 0.35)',
          opacity: zoomedIndex === null ? 0 : 1,
          transition: 'opacity 0.4s',
        }}
      />

      {/* 접힌 모서리 — 누르면 넘어간다. 커서를 올리면 모서리가 조금 더 들린다 */}
      {[
        { side: 'left', target: spread - 1, label: '이전 장 넘기기', left: bookLeft },
        { side: 'right', target: spread + 1, label: '다음 장 넘기기', left: spineX + pageW - CORNER },
      ].map(({ side, target, label, left }) =>
        target >= 0 && target < spreadCount ? (
          <ButtonBase
            key={side}
            onClick={() => goTo(target)}
            aria-label={label}
            sx={{
              position: 'absolute',
              left: dpx(left),
              top: dpx(top + pageH - CORNER),
              width: dpx(CORNER),
              height: dpx(CORNER),
              zIndex: 45,
              '& .curl': {
                position: 'absolute',
                inset: 0,
                clipPath:
                  side === 'right' ? 'polygon(100% 45%, 100% 100%, 45% 100%)' : 'polygon(0 45%, 0 100%, 55% 100%)',
                background: `linear-gradient(${side === 'right' ? 315 : 45}deg, #2b2824 0 25%, #d8cfbd 26%, #fbf8f1 60%)`,
                transformOrigin: side === 'right' ? '100% 100%' : '0 100%',
                transition: `scale 0.35s ${EASE}`,
              },
              '&:hover .curl, &.Mui-focusVisible .curl': { scale: '1.7' },
            }}
          >
            <Box className="curl" aria-hidden />
          </ButtonBase>
        ) : null,
      )}

      {/* 책 아래 — 화살표 + 쪽 번호 */}
      <Box
        sx={{
          position: 'absolute',
          left: dpx(spineX),
          top: dpx(top + pageH + COVER_PAD + 14),
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: dpx(18),
        }}
      >
        {[
          { text: '←', target: spread - 1, label: '이전 장' },
          null,
          { text: '→', target: spread + 1, label: '다음 장' },
        ].map((button) =>
          button ? (
            <ButtonBase
              key={button.label}
              onClick={() => goTo(button.target)}
              disabled={button.target < 0 || button.target >= spreadCount}
              aria-label={button.label}
              sx={{
                ...aboutTextSx,
                fontSize: dpx(15),
                width: dpx(28),
                height: dpx(28),
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                transition: 'background-color 0.3s, color 0.3s',
                '&:hover, &.Mui-focusVisible': { bgcolor: '#ffffff', color: '#000000' },
                '&.Mui-disabled': { opacity: 0.25 },
              }}
            >
              {button.text}
            </ButtonBase>
          ) : (
            <Typography
              key="counter"
              aria-live="polite"
              sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(12), letterSpacing: '0.12em', whiteSpace: 'pre' }}
            >
              {pad2(spread * 2 + 1)} — {pad2(spread * 2 + 2)}
              <Box component="span" sx={{ color: '#6f6f6f' }}>
                {'  /  '}
                {pad2(pages.length)}
              </Box>
            </Typography>
          ),
        )}
      </Box>
    </Box>
  );
};

export default ArchiveBook;
