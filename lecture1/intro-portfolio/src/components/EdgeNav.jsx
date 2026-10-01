import Box from '@mui/material/Box';
import { navigateWithFade } from '../utils/pageTransition';

// 화면 양옆 가운데에 붙는 이전·다음 페이지 링크 (참고: seunghyuk.com의 "< ABOUT · CONTACT >")
// 페이지를 한 줄로 이어 둔다: MAIN → ABOUT ME → AI INFLUENCER → ILLUSTRATION → MAIN
// 데스크톱에서만 보인다 — 모바일은 화면이 좁아 본문과 겹치므로 BACK 버튼과 헤더 메뉴로 충분하다

const BASE = import.meta.env.BASE_URL;

export const PAGE_LINKS = {
  main: { label: 'MAIN', href: BASE },
  about: { label: 'ABOUT ME', href: `${BASE}about.html` },
  ai: { label: 'AI INFLUENCER', href: `${BASE}project-ai.html` },
  illustration: { label: 'ILLUSTRATION', href: `${BASE}project-illustration.html` },
};

const handleClick = (href) => (event) => {
  event.preventDefault();
  navigateWithFade(() => {
    window.location.href = href;
  });
};

// 본문이 화면 가장자리 가까이까지 오는 페이지가 있어, 맨 가장자리에 세로 글씨로 세운다
// (세우면 < > 화살표 방향이 틀어지므로 PREV·NEXT로 방향을 알려 주고, 올리면 바깥쪽으로 살짝 밀려난다)
const EdgeLink = ({ page, side }) => {
  const isLeft = side === 'left';
  return (
    <Box
      component="a"
      href={page.href}
      onClick={handleClick(page.href)}
      aria-label={`${isLeft ? '이전' : '다음'} 페이지 ${page.label}(으)로 이동`}
      sx={{
        position: 'fixed',
        top: '50%',
        [side]: 12,
        zIndex: 100,
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        gap: 1.25,
        writingMode: 'vertical-rl',
        // 왼쪽은 아래에서 위로, 오른쪽은 위에서 아래로 읽힌다 — 둘 다 글자 윗부분이 화면 안쪽을 향한다
        transform: `translateY(-50%)${isLeft ? ' rotate(180deg)' : ''}`,
        color: '#ffffff',
        mixBlendMode: 'difference',
        textDecoration: 'none',
        fontFamily: '"Alumni Sans", sans-serif',
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '0.2em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        opacity: 0.6,
        transition: 'opacity 0.25s ease, translate 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        '& .edgeHint': { opacity: 0.5, fontSize: 11 },
        '&:hover, &:focus-visible': { opacity: 1, translate: `${isLeft ? -4 : 4}px 0` },
      }}
    >
      <span className="edgeHint">{isLeft ? 'PREV' : 'NEXT'}</span>
      {page.label}
    </Box>
  );
};

// prev·next: PAGE_LINKS의 항목
const EdgeNav = ({ prev, next }) => (
  <>
    {prev && <EdgeLink page={prev} side="left" />}
    {next && <EdgeLink page={next} side="right" />}
  </>
);

export default EdgeNav;
