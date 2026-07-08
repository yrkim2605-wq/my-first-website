import { Box, Container, Stack } from '@mui/material';
import StatCounter from './StatCounter';

function StatsSection({ stats }) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="md">
        <Stack
          direction="row"
          spacing={4}
          useFlexGap
          sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {stats.map((stat) => (
            <StatCounter key={stat.label} value={stat.value} label={stat.label} suffix={stat.suffix} />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

export default StatsSection;
