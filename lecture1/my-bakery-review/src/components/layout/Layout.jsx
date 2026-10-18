import { Suspense, useEffect } from 'react'
import { useLenis } from 'lenis/react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTopButton from '../common/ScrollToTopButton'
import ErrorBoundary from '../common/ErrorBoundary'
import { useProfile } from '../../hooks/useProfile'

const Layout = () => {
  const location = useLocation()
  const lenis = useLenis()
  const { profile, ready } = useProfile()

  // 다른 페이지로 이동하면 맨 위에서 시작해요 (부드러운 스크롤 Lenis를 쓰면 그쪽으로 즉시 이동)
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [location.pathname, lenis])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 맨 위 안내 띠: 지금 실제로 있는 기능(EXP · 퀘스트 · 배지 · 레벨)만 알려요. 레벨 혜택은 아직 제공하지 않아서 말하지 않아요. */}
      <Box
        component={Link}
        to={profile ? '/mypage' : '/signup'}
        sx={{
          minHeight: 44,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 0.75,
          textDecoration: 'none',
          '&:hover .promo-banner-cta': { textDecorationColor: 'currentColor' },
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.85rem' }, textAlign: 'center', wordBreak: 'keep-all' }}>
          모험 일지를 남기면 EXP가 쌓이고, 퀘스트 · 배지로 레벨업해요{' '}
          {/* 로그인 여부를 알기 전에는 안내 링크 글자를 비워서, 로그인한 사람에게 "모험가 만들기"가 잠깐 보이지 않게 해요 */}
          {ready && (
            <Box
              component="span"
              className="promo-banner-cta"
              sx={{
                // 글자와 화살표(→)를 한 덩어리로 묶어서, 좁은 화면에서도 화살표만 줄 끝에 홀로 남지 않고 다음 줄로 같이 내려가요
                display: 'inline-block',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                color: 'mustard.main',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                textUnderlineOffset: 3,
                transition: 'text-decoration-color 0.15s ease',
              }}
            >
              {profile ? '내 모험가 보기 →' : '모험가 만들기 →'}
            </Box>
          )}
        </Typography>
      </Box>
      <Header />
      {/* position/zIndex 1: 푸터 윗공간 배경 그림(zIndex 0)이 페이지 내용 뒤로 가도록 해요 (그림이 위 콘텐츠 쪽으로 올라와 겹칠 때 글을 가리지 않아요) */}
      <Box component="main" sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <Box key={location.pathname} className="page-fade">
          {/* 페이지 파일을 불러오는 동안 푸터가 위로 튀지 않도록 빈 공간을 잡아둬요 */}
          {/* 한 페이지에서 오류가 나도 헤더 · 푸터는 그대로 두고, 다른 페이지로 가면 다시 시도해요 */}
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<Box sx={{ minHeight: '60vh' }} />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
      <Footer />
      {/* 레벨 정보는 헤더로 옮겼어요. 화면에 떠 있는 건 "맨 위로" 버튼 하나뿐이에요. */}
      <Box sx={{ position: 'fixed', right: { xs: 16, sm: 28 }, bottom: { xs: 16, sm: 28 }, zIndex: 1200 }}>
        <ScrollToTopButton />
      </Box>
    </Box>
  )
}

export default Layout
