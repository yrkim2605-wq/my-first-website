import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { rafThrottle } from '../utils/rafThrottle';
import { useParallax } from '../hooks/useParallax';

function ScrollRevealStatement({ id, text }) {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const bgRef = useParallax(0.15);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const update = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }
      const scrolled = -rect.top;
      const ratio = Math.min(1, Math.max(0, scrolled / scrollable));
      setProgress(ratio);
    };

    const handleScroll = rafThrottle(update);
    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const characters = text.split('');

  return (
    <Box ref={trackRef} sx={{ position: 'relative', height: { xs: '160vh', md: '200vh' } }}>
      <Box
        id={id}
        component="section"
        sx={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000000',
          overflow: 'hidden',
        }}
      >
        {/* 배경 이미지: 패럴렉스로 텍스트와 함께 스크롤 */}
        <Box
          ref={bgRef}
          aria-hidden
          sx={{
            position: 'absolute',
            inset: '-10% 0',
            backgroundImage: 'url(https://www.finsightlabs.co.kr/static/images/main/hero_img.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: 'translate3d(0, var(--parallax-y, 0px), 0)',
            willChange: 'transform',
          }}
        />
        {/* 어두운 오버레이: 텍스트 가독성 확보 */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.55)',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography
            component="p"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            {characters.map((char, index) => {
              const charOpacity = Math.min(1, Math.max(0, progress * characters.length - index));
              return (
                <Box
                  component="span"
                  key={index}
                  sx={{
                    color: `rgba(255, 255, 255, ${0.12 + charOpacity * 0.88})`,
                  }}
                >
                  {char === ' ' ? ' ' : char}
                </Box>
              );
            })}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default ScrollRevealStatement;
