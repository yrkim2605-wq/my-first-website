import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import { PROFILE } from '../../constants/profile'

const Footer = () => {
  return (
    <Box
      id="contact"
      component="footer"
      sx={{ bgcolor: 'primary.main', color: 'background.default', pt: 10, pb: 4, textAlign: 'center' }}
    >
      <Container maxWidth="lg">
        <Typography
          sx={{
            fontFamily: 'Anton',
            fontSize: { xs: '4rem', md: '9rem' },
            lineHeight: 0.9,
          }}
        >
          {PROFILE.contactTitle}
        </Typography>
        <Typography
          sx={{ fontFamily: '"Alumni Sans"', fontWeight: 600, fontSize: '1.5rem', mt: 2 }}
        >
          {PROFILE.contactSubtitle}
        </Typography>
        <Typography
          sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#949494', mt: 1 }}
        >
          {PROFILE.contactBody}
        </Typography>

        <Button
          href={`mailto:${PROFILE.email}`}
          sx={{
            mt: 4,
            px: 4,
            py: 1.5,
            bgcolor: 'background.default',
            color: 'primary.main',
            borderRadius: 0,
            fontFamily: '"Alumni Sans"',
            fontWeight: 600,
            fontSize: '1.25rem',
            '&:hover': { bgcolor: 'secondary.main' },
          }}
        >
          CONTACT &gt;
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          divider={<Box sx={{ display: { xs: 'none', sm: 'block' }, width: '1px', bgcolor: '#333' }} />}
          sx={{
            mt: 8,
            pt: 3,
            borderTop: '1px solid #333333',
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-end' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#949494' }}>
              CONTACT ME
            </Typography>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '0.75rem' }}>
              TEL : {PROFILE.tel}
            </Typography>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '0.75rem' }}>
              MAIL : {PROFILE.email}
            </Typography>
          </Box>

          {PROFILE.github && (
            <Button
              href={PROFILE.github}
              target="_blank"
              rel="noopener"
              sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'background.default' }}
            >
              GitHub
            </Button>
          )}

          <Typography sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#949494' }}>
            © {new Date().getFullYear()} {PROFILE.name}. ALL RIGHTS RESERVED.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer
