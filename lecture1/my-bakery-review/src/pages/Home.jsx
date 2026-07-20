import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import PixelButton from '../components/common/PixelButton'
import BakeryStageCard from '../components/common/BakeryStageCard'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'

const Home = () => {
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)

  const selectedDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId)
  const filteredBakeries = selectedDistrictId
    ? BAKERIES.filter((b) => b.districtId === selectedDistrictId)
    : BAKERIES

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 6, sm: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 8, sm: 12 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.8rem', sm: '4.2rem' }, mb: 2 }}>
            빵덕후 레벨업
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 560, mx: 'auto', fontSize: '1.05rem' }}>
            빵집을 방문하고 리뷰를 남길수록 경험치가 쌓여요. 부산 빵지순례를 시작해보세요.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PixelButton to="/community" variant="outlined" color="primary">
              커뮤니티 가기
            </PixelButton>
            <PixelButton to="/mypage" variant="outlined" color="primary">
              내 인벤토리
            </PixelButton>
            <PixelButton to="/ranking" variant="outlined" color="primary">
              랭킹 보기
            </PixelButton>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h2">
              {selectedDistrict ? selectedDistrict.name : '전체'} 빵집
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              label="전체"
              variant={!selectedDistrictId ? 'filled' : 'outlined'}
              color={!selectedDistrictId ? 'primary' : 'default'}
              onClick={() => setSelectedDistrictId(null)}
            />
            {DISTRICTS.map((district) => (
              <Chip
                key={district.id}
                label={district.name}
                variant={selectedDistrictId === district.id ? 'filled' : 'outlined'}
                color={selectedDistrictId === district.id ? 'primary' : 'default'}
                onClick={() => setSelectedDistrictId(district.id)}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {filteredBakeries.map((bakery) => {
              const district = DISTRICTS.find((d) => d.id === bakery.districtId)
              return (
                <BakeryStageCard
                  key={bakery.id}
                  {...bakery}
                  districtLabel={district?.name}
                />
              )
            })}
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

export default Home
