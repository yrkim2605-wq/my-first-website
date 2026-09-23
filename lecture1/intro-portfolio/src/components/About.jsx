import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularText from './CircularText';

const IsoCube = () => (
  <Box
    aria-hidden
    sx={{
      position: 'relative',
      width: 56,
      height: 64,
      display: { xs: 'none', md: 'block' },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        width: 40,
        height: 40,
        top: 0,
        left: 8,
        background: 'linear-gradient(135deg, #e8e8e8, #bdbdbd)',
        transform: 'rotate(45deg) skew(10deg, 10deg)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        width: 40,
        height: 20,
        bottom: 0,
        left: 8,
        background: 'linear-gradient(180deg, #9c9c9c, #4d4d4d)',
        transform: 'skew(0deg, -20deg)',
      }}
    />
  </Box>
);

const About = () => {
  return (
    <Box
      id="about"
      sx={{
        position: 'relative',
        bgcolor: '#ffffff',
        color: '#111111',
        px: { xs: 3, md: 6 },
        py: { xs: 8, md: 14 },
        overflow: 'hidden',
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <IsoCube />
        <Typography
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '13vw', sm: 40, md: 'clamp(36px, 5.5vw, 70px)' },
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          FROM CURIOSITY,
          <br />
          INTO EXPERIENCE
        </Typography>

        <Typography
          sx={{
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: { xs: 16, md: 20 },
            letterSpacing: '-0.02em',
            color: '#111111',
            maxWidth: 480,
          }}
        >
          I EXPLORE IDEAS, SHAPE THEM VISUALLY,
          <br />
          AND TURN THEM INTO EXPERIENCES PEOPLE CAN SEE AND USE.
        </Typography>

        <Box
          sx={{
            bgcolor: '#000000',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 160, md: 200 },
            height: { xs: 160, md: 200 },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Anton", sans-serif',
              fontWeight: 400,
              fontSize: { xs: 20, md: 30 },
              letterSpacing: '-0.02em',
            }}
          >
            WHAT I DO ?
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          position: 'absolute',
          right: { xs: 12, md: 56 },
          bottom: { xs: 24, md: 64 },
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <CircularText
          text="TURNING EVERY IDEA INTO PEOPLE, STORIES AND BRANDS. "
          size={170}
          fontSize={9}
          color="#111111"
          duration={26}
        />
      </Box>
    </Box>
  );
};

export default About;
