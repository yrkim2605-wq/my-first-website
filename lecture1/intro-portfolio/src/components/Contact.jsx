import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const Contact = () => {
  return (
    <Box
      id="contact"
      sx={{
        bgcolor: '#ffffff',
        color: '#111111',
        px: { xs: 3, md: 6 },
        pt: { xs: 8, md: 12 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '20vw', sm: 90, md: 'clamp(70px, 12vw, 150px)' },
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
          }}
        >
          CONTACT
        </Typography>

        <Typography
          sx={{
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: 25,
            letterSpacing: '-0.02em',
          }}
        >
          LET&apos;S TURN IDEAS INTO EXPERIENCE.
        </Typography>

        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 12,
            color: '#949494',
          }}
        >
          새로운 아이디어와 협업의 기회를 기다리고 있습니다.
        </Typography>

        <Box
          component="a"
          href="mailto:melon0503@naver.com"
          sx={{
            bgcolor: '#000000',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 5,
            py: 1.5,
            textDecoration: 'none',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Alumni Sans", sans-serif',
              fontWeight: 600,
              fontSize: 35,
              letterSpacing: '-0.02em',
            }}
          >
            CONTACT ›
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 0 }}
        sx={{
          mt: { xs: 8, md: 10 },
          pt: 3,
          borderTop: '1px solid #e0e0e0',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          fontFamily: '"Alumni Sans", sans-serif',
          fontWeight: 600,
          fontSize: 16,
          color: '#949494',
        }}
      >
        <Box>CONTACT ME</Box>
        <Box>MAIL : melon0503@naver.com</Box>
        <Box>TEL : 010.7221.2605</Box>
        <Box
          component="a"
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          sx={{ color: '#949494' }}
        >
          GitHub
        </Box>
        <Box>© 2026 KIM YURI. ALL RIGHTS RESERVED.</Box>
      </Stack>
    </Box>
  );
};

export default Contact;
