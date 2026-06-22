import { Box, Container, Typography } from '@mui/material';

function Section({ id, title, description, accent = false, children }) {
  return (
    <Box
      id={id}
      component="section"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: accent ? 'secondary.main' : 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: accent ? '#FFFFFF' : 'primary.main',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: accent ? '#FFFFFF' : 'text.secondary',
            maxWidth: 560,
            mx: 'auto',
          }}
        >
          {description}
        </Typography>
        {children}
      </Container>
    </Box>
  );
}

export default Section;
