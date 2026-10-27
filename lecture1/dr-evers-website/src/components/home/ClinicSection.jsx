import { Box, Button, Container, Typography } from '@mui/material'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { CLINIC } from '../../constants/siteData'

const ClinicSection = () => {
  return (
    <Box id="clinic" sx={{ py: 10, scrollMarginTop: 64, bgcolor: 'background.tint' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            p: { xs: 3, md: 5 },
            borderRadius: 6,
            bgcolor: 'white',
            boxShadow: '0 8px 32px rgba(15, 143, 137, 0.12)',
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ mb: 2, fontSize: '2rem' }}>
              Dr. Evers Clinic
            </Typography>
            <Typography sx={{ fontWeight: 600, mb: 4 }}>{CLINIC.address}</Typography>

            <Typography variant="caption" color="text.secondary">
              진료시간
            </Typography>
            {CLINIC.hours.map(({ label, time }) => (
              <Typography key={label} sx={{ mt: 0.5 }}>
                <Box component="span" sx={{ fontWeight: 700, mr: 2 }}>
                  {label}
                </Box>
                {time}
              </Typography>
            ))}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              {CLINIC.hoursNote}
            </Typography>

            <Typography variant="h2" sx={{ mb: 3, fontSize: '2rem' }}>
              {CLINIC.phone}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" href={`tel:${CLINIC.phone}`}>
                상담/예약하기
              </Button>
              <Button
                variant="outlined"
                size="large"
                href={`https://map.naver.com/p/search/${encodeURIComponent(CLINIC.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                지점 안내
              </Button>
            </Box>
          </Box>

          <ImagePlaceholder label="MAP" sx={{ minHeight: 280, borderRadius: 4 }} />
        </Box>
      </Container>
    </Box>
  )
}

export default ClinicSection
