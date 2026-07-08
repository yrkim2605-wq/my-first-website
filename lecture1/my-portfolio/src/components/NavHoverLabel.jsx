import { Box } from '@mui/material';

function NavHoverLabel({ text }) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '1.4em',
        lineHeight: '1.4em',
      }}
    >
      <Box
        className="nav-hover-inner"
        sx={{
          transition: 'transform 0.35s cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        <Box component="span" sx={{ display: 'block', height: '1.4em', lineHeight: '1.4em' }}>
          {text}
        </Box>
        <Box
          component="span"
          sx={{ display: 'block', height: '1.4em', lineHeight: '1.4em', color: 'primary.main' }}
        >
          {text}
        </Box>
      </Box>
    </Box>
  );
}

export default NavHoverLabel;
