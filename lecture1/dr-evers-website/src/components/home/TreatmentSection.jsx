import { Box, Container, Typography } from '@mui/material'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import TreatmentCard from '../common/TreatmentCard'
import { TREATMENTS } from '../../constants/treatments'

// 카드 id마다 어울리는 아이콘을 짝지어 둔 목록
const TREATMENT_ICONS = {
  acne: WaterDropOutlinedIcon,
  pore: TrackChangesIcon,
  pigment: WbSunnyOutlinedIcon,
  wrinkle: AutoAwesomeOutlinedIcon,
}

const TreatmentSection = () => {
  return (
    <Box
      id="treatment"
      sx={{
        py: { xs: 8, md: 12 },
        scrollMarginTop: 64,
        background: 'linear-gradient(180deg, #f5fbfa 0%, #e3f3f1 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          {/* 제목 위의 작은 영문 문구와 양옆 선 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ width: 60, height: '1px', bgcolor: 'divider' }} />
            <Typography
              sx={{ fontFamily: 'fontFamilySerif', fontSize: 11, letterSpacing: '0.3em', color: 'text.secondary' }}
            >
              Skin Concerns
            </Typography>
            <Box sx={{ width: 60, height: '1px', bgcolor: 'divider' }} />
          </Box>
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3.25rem' }, fontWeight: 700 }}>
            Find Your Treatment
          </Typography>
          <Typography sx={{ mt: 1, fontWeight: 500, color: 'primary.dark' }}>
            피부 고민 카테고리별로 선택해보세요
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {TREATMENTS.map((item) => (
            <TreatmentCard
              key={item.id}
              title={item.title}
              description={item.description}
              tags={item.tags}
              Icon={TREATMENT_ICONS[item.id]}
            />
          ))}
        </Box>
      </Container>
    </Box>
  )
}

export default TreatmentSection
