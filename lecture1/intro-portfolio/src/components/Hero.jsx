import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularText from './CircularText';

const RIBBON_BARS = [0, 1, 2, 3, 4, 5, 6];

const Hero = () => {
  return (
    <Box
      id="home"
      sx={{
        position: 'relative',
        bgcolor: '#000000',
        color: '#ffffff',
        overflow: 'hidden',
        pt: { xs: 6, md: 10 },
        pb: { xs: 10, md: 16 },
        px: { xs: 3, md: 6 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: 260, md: 420 },
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '22vw', sm: '18vw', md: 'clamp(120px, 16vw, 300px)' },
            lineHeight: 0.85,
            letterSpacing: '-0.03em',
            textAlign: 'center',
          }}
        >
          IDEA
        </Typography>

        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: { xs: '5%', md: '8%' },
            top: '50%',
            transform: 'translateY(-50%) rotate(-8deg)',
            display: 'flex',
            gap: '2px',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        >
          {RIBBON_BARS.map((i) => (
            <Box
              key={i}
              sx={{
                width: { xs: 14, md: 26 },
                height: { xs: 90, md: 170 },
                borderRadius: '4px',
                background: `linear-gradient(180deg, rgba(255,255,255,${0.9 - i * 0.1}) 0%, rgba(120,120,120,${0.5 - i * 0.05}) 60%, rgba(20,20,20,0.9) 100%)`,
                transform: `skewY(${(i - 3) * 3}deg)`,
              }}
            />
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          right: { xs: 12, md: 48 },
          bottom: { xs: 24, md: 48 },
        }}
      >
        <CircularText
          text="TURNING EVERY IDEA INTO A VISUAL EXPERIENCE, "
          size={150}
          fontSize={9}
          color="#ffffff"
          duration={24}
        />
      </Box>
    </Box>
  );
};

export default Hero;
