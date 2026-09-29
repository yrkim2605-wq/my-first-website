import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { navigateWithFade } from '../../utils/pageTransition';

// 왼쪽 아래 뒤로가기 버튼 — 오른쪽 아래 Scroll 안내와 짝을 이룬다
// 메인 페이지에서 들어왔다면 브라우저 뒤로가기로 돌아가 보던 위치를 그대로 되살리고,
// 주소로 바로 들어왔다면 메인 페이지의 section(기본: 스킬 섹션)으로 이동한다
const BackButton = ({ section = 'skills' }) => {
  const homeUrl = `${import.meta.env.BASE_URL}#${section}`;

  const handleBackClick = (event) => {
    event.preventDefault();
    const cameFromThisSite = document.referrer && new URL(document.referrer).origin === window.location.origin;
    navigateWithFade(() => {
      if (cameFromThisSite && window.history.length > 1) window.history.back();
      else window.location.href = homeUrl;
    });
  };

  return (
    <Box
      component="a"
      href={homeUrl}
      onClick={handleBackClick}
      aria-label="메인 페이지로 돌아가기"
      sx={{
        position: 'fixed',
        left: { xs: 16, md: 30 },
        bottom: { xs: 16, md: 26 },
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1,
        pl: 1.5,
        pr: 2,
        borderRadius: 999,
        // 페이지 배경이 거의 검정이라 어두운 판은 묻히므로, 테두리가 있는 밝은 유리판을 깐다
        // → 검정 배경에서도 테두리로 또렷하고, 사진 위에서도 흐림 효과로 도드라진다
        bgcolor: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(8px)',
        color: '#ffffff',
        textDecoration: 'none',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
        '&:hover, &:focus-visible': { bgcolor: 'rgba(255, 255, 255, 0.24)', borderColor: 'rgba(255, 255, 255, 0.7)' },
        '& .backArrow': { transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' },
        '&:hover .backArrow, &:focus-visible .backArrow': { transform: 'translateX(-6px)' },
      }}
    >
      <Box
        component="svg"
        className="backArrow"
        viewBox="0 0 34 24"
        aria-hidden
        sx={{ width: 30, height: 20 }}
      >
        <path d="M34 12 H2 M13 1 L2 12 L13 23" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </Box>
      <Typography
        className="backLabel"
        sx={{
          fontFamily: '"Alumni Sans", sans-serif',
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: '0.02em',
          lineHeight: 1,
          transition: 'opacity 0.2s',
        }}
      >
        BACK
      </Typography>
    </Box>
  );
};

export default BackButton;
