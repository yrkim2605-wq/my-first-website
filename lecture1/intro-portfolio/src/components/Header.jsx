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
        transform: 'translateY(5px)',
        py: { xs: 1, md: 0.5 },
        lineHeight: 1,
        px: { xs: 3, md: 3 },
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
            letterSpacing: '0.27em',
            lineHeight: 1,
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          IDEAMADE
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 3, md: 8 }}
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
                letterSpacing: '-0.07em',
                lineHeight: 1,
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
