import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const NAV_ITEMS = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#about' },
  { label: 'PROJECTS', href: '#projects' },
  { label: 'CONTACT', href: '#contact' },
];

const Header = () => {
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        mixBlendMode: 'difference',
        py: { xs: 2, md: 3 },
        px: { xs: 3, md: 6 },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography
          component="a"
          href="#home"
          sx={{
            fontFamily: '"Stick No Bills", sans-serif',
            fontWeight: 800,
            fontSize: { xs: 14, md: 20 },
            letterSpacing: '0.35em',
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          IDEAMADE
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 2, md: 5 }}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          {NAV_ITEMS.map((item) => (
            <Typography
              key={item.label}
              component="a"
              href={item.href}
              sx={{
                fontFamily: '"Alumni Sans", sans-serif',
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                textDecoration: 'none',
                '&:hover': { opacity: 0.7 },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default Header;
