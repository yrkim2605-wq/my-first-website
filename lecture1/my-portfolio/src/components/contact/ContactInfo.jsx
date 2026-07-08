import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';

const ContactInfo = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'center',
      alignItems: 'center',
      gap: { xs: 3, sm: 6 },
    }}
  >
    <Link
      href="mailto:yrkim2605@gmail.com"
      underline="none"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: '#FFFFFF',
        fontWeight: 700,
        '&:hover': { opacity: 0.85 },
      }}
    >
      <EmailIcon />
      <Typography component="span" sx={{ fontWeight: 700 }}>
        yrkim2605@gmail.com
      </Typography>
    </Link>

    <Stack direction="row" spacing={2}>
      <IconButton
        component="a"
        href="https://github.com/yrkim2605-wq"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          bgcolor: '#FFFFFF',
          color: 'primary.main',
          '&:hover': { bgcolor: '#EDE9FE' },
        }}
      >
        <GitHubIcon />
      </IconButton>
      <IconButton
        component="a"
        href="https://instagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          bgcolor: '#FFFFFF',
          color: 'primary.main',
          '&:hover': { bgcolor: '#EDE9FE' },
        }}
      >
        <InstagramIcon />
      </IconButton>
    </Stack>
  </Box>
);

export default ContactInfo;
