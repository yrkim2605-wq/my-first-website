import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularText from './CircularText';
import RibbonBand from './RibbonBand';
import GlassCube from './GlassCube';

const bigDisplaySx = {
  position: 'absolute',
  fontFamily: '"Anton", sans-serif',
  fontWeight: 400,
  fontSize: { xs: '30cqw', md: '21cqw' },
  lineHeight: 1,
  letterSpacing: '-0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const Hero = () => {
  return (
    <Box
      id="home"
      sx={{
        position: 'relative',
        mt: '30px',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        containerType: 'inline-size',
        aspectRatio: { xs: '4 / 5', md: '1192 / 600' },
      }}
    >
      {/* IDEA — 검정에서 회색으로 흐르는 그라데이션 + 세로 줄무늬 */}
      <Typography
        component="h1"
        sx={{
          ...bigDisplaySx,
          left: '-1.2cqw',
          top: { xs: '4%', md: '7.3%' },
          color: 'transparent',
          backgroundImage: `
            repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 0.32cqw, rgba(255,255,255,0.28) 0.32cqw 0.4cqw),
            linear-gradient(90deg, #000000 0%, #3a3a3a 25%, #9a9a9a 60%, #dcdcdc 100%)
          `,
          backgroundSize: '100% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        IDEA
      </Typography>

      {/* MADE — 외곽선만 있는 글자 */}
      <Typography
        aria-hidden
        sx={{
          ...bigDisplaySx,
          left: { xs: '30%', md: '61%' },
          top: { xs: '58%', md: '41%' },
          color: 'transparent',
          WebkitTextStroke: '1px #111111',
        }}
      >
        MADE
      </Typography>

      <GlassCube
        sx={{
          position: 'absolute',
          left: { xs: '8%', md: '6.5%' },
          top: { xs: '24%', md: '35%' },
          transform: { xs: 'scale(1.5)', md: 'none' },
          zIndex: 2,
        }}
      />

      <RibbonBand
        sx={{
          position: 'absolute',
          left: { xs: '30%', md: '27%' },
          top: { xs: '16%', md: '6%' },
          transform: { xs: 'scale(1.35)', md: 'none' },
          width: '46cqw',
          height: '40cqw',
          zIndex: 1,
        }}
      />

      <CircularText
        text="TURNING EVERY IDEA INTO A VISUAL EXPERIENCE THAT CONNECTS PEOPLE, STORIES AND BRANDS. "
        size={380}
        fontSize={30}
        color="#111111"
        duration={30}
        reverse
        sx={{
          position: 'absolute',
          left: { xs: '50%', md: '69.5%' },
          top: { xs: '60%', md: '44%' },
          width: { xs: '40cqw', md: '23cqw' },
          height: { xs: '40cqw', md: '23cqw' },
          zIndex: 3,
        }}
      />
    </Box>
  );
};

export default Hero;
