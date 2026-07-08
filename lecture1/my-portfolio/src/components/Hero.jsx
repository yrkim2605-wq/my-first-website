import { keyframes } from '@emotion/react';
import { Box, Button, Container, Fade, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useScrollY } from '../hooks/useScrollY';
import { useMagneticHover } from '../hooks/useMagneticHover';

const HEADLINE = 'WEB.CONTENT.DESIGNER';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35); }
  50% { box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
`;

const reduceMotionQuery = '@media (prefers-reduced-motion: reduce)';

// 요청된 브레이크포인트: 모바일 <=767, 태블릿 768~1199, 데스크톱 1200+
const MOBILE_QUERY = '(max-width:767px)';
const TABLET_QUERY = '(min-width:768px) and (max-width:1199px)';

const MIN_TOUCH_TARGET = 44;

function renderHeadline(text) {
  const parts = text.split('.');
  return parts.map((part, index) => (
    <Box component="span" key={index}>
      {part}
      {index < parts.length - 1 && (
        <>
          <Box component="span" sx={{ color: 'primary.light' }}>
            .
          </Box>
          <wbr />
        </>
      )}
    </Box>
  ));
}

function Hero({ onExploreProjects, onContact, onScrollNext }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const scrollFadeRef = useScrollY();
  const primaryButtonRef = useMagneticHover(0.3);
  const secondaryButtonRef = useMagneticHover(0.3);
  const githubRef = useMagneticHover(0.4);
  const instagramRef = useMagneticHover(0.4);

  const heroPaddingY = isMobile ? 6 : isTablet ? 8 : 10;
  const heroPaddingX = isMobile ? 2.5 : isTablet ? 4 : 6;

  const headlineFontSize = isMobile ? '2.3rem' : isTablet ? '4.4rem' : '7.4rem';
  const headlineLineHeight = isMobile ? 1.12 : isTablet ? 1.02 : 0.98;
  const headlineMarginBottom = isMobile ? 2 : 3;

  const subtitleFontSize = isMobile ? '0.9rem' : isTablet ? '1rem' : '1.05rem';
  const subtitleLineHeight = isMobile ? 1.6 : 1.7;
  const subtitleMarginBottom = isMobile ? 3 : isTablet ? 4 : 5;

  return (
    <Box
      component="section"
      id="hero"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: heroPaddingY,
        bgcolor: '#000000',
        color: '#FFFFFF',
        textAlign: 'left',
      }}
    >
      <Container
        ref={scrollFadeRef}
        maxWidth="xl"
        sx={{
          position: 'relative',
          px: heroPaddingX,
          transform: 'translate3d(0, calc(var(--scroll-y, 0) * 0.15px), 0)',
          opacity: 'clamp(0, calc(1 - var(--scroll-y, 0) / 500), 1)',
          willChange: 'opacity, transform',
        }}
      >
        <Fade in timeout={700}>
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              mb: headlineMarginBottom,
              lineHeight: headlineLineHeight,
              letterSpacing: '-0.03em',
              fontSize: headlineFontSize,
            }}
          >
            {renderHeadline(HEADLINE)}
          </Typography>
        </Fade>

        <Fade in timeout={700} style={{ transitionDelay: '200ms' }}>
          <Typography
            sx={{
              opacity: 0.8,
              maxWidth: 640,
              mb: subtitleMarginBottom,
              lineHeight: subtitleLineHeight,
              fontSize: subtitleFontSize,
            }}
          >
            웹디자인과 콘텐츠 디자인 역량을 키워, 사용자에게 보기 쉽고 편리한 웹사이트를 만드는 것이 목표입니다.
          </Typography>
        </Fade>

        <Fade in timeout={700} style={{ transitionDelay: '400ms' }}>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={isMobile ? 1.5 : 2}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            <Button
              ref={primaryButtonRef}
              fullWidth={isMobile}
              size="large"
              variant="contained"
              onClick={onExploreProjects}
              sx={{
                minHeight: MIN_TOUCH_TARGET,
                bgcolor: '#FFFFFF',
                color: 'primary.main',
                px: 4,
                animation: `${pulseGlow} 2.6s ease-in-out infinite`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                [reduceMotionQuery]: { animation: 'none' },
                '&:hover': {
                  bgcolor: '#EDE9FE',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.18)',
                },
              }}
            >
              프로젝트 보기
            </Button>
            <Button
              ref={secondaryButtonRef}
              fullWidth={isMobile}
              size="large"
              variant="outlined"
              onClick={onContact}
              sx={{
                minHeight: MIN_TOUCH_TARGET,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                color: '#FFFFFF',
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  borderColor: '#FFFFFF',
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              연락하기
            </Button>
          </Stack>
        </Fade>

        <Fade in timeout={700} style={{ transitionDelay: '600ms' }}>
          <Stack direction="row" spacing={isMobile ? 2 : 1.5} sx={{ mt: isMobile ? 3 : 4 }}>
            <IconButton
              ref={githubRef}
              component="a"
              href="https://github.com/yrkim2605-wq"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              sx={{
                width: MIN_TOUCH_TARGET,
                height: MIN_TOUCH_TARGET,
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'transform 0.2s ease, background-color 0.2s ease, color 0.2s ease',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  color: 'primary.main',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton
              ref={instagramRef}
              component="a"
              href="https://instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              sx={{
                width: MIN_TOUCH_TARGET,
                height: MIN_TOUCH_TARGET,
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'transform 0.2s ease, background-color 0.2s ease, color 0.2s ease',
                '&:hover': {
                  bgcolor: '#FFFFFF',
                  color: 'primary.main',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              <InstagramIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Fade>
      </Container>

      <Box
        sx={{
          position: 'absolute',
          bottom: isMobile ? 12 : 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={onScrollNext}
          aria-label="아래로 스크롤"
          sx={{
            minWidth: MIN_TOUCH_TARGET,
            minHeight: MIN_TOUCH_TARGET,
            bgcolor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${bounce} 1.8s ease-in-out infinite`,
            [reduceMotionQuery]: { animation: 'none' },
            '&:hover': { opacity: 0.8 },
          }}
        >
          <KeyboardArrowDownIcon fontSize="large" />
        </Box>
      </Box>
    </Box>
  );
}

export default Hero;
