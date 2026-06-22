import { Box, Container, Typography } from '@mui/material';

function AboutMe() {
  return (
    <Box
      component="section"
      sx={{ py: { xs: 10, md: 16 }, minHeight: '60vh', display: 'flex', alignItems: 'center' }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
          About Me 페이지가 개발될 공간입니다
        </Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
          상세한 자기소개가 들어갈 예정입니다.
        </Typography>
      </Container>
    </Box>
  );
}

export default AboutMe;
