import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import WoodPanel from '../components/common/WoodPanel'
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
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <WoodPanel
          variant="dark"
          sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', mb: 4 }}
        >
          <Typography variant="h1" sx={{ color: '#FFF8EC', mb: 1 }}>
            빵덕후 레벨업
          </Typography>
          <Typography variant="body1" sx={{ color: '#FFF8EC', mb: 3 }}>
            빵집을 방문하고 리뷰를 남길수록 경험치가 쌓여요. 부산 빵지순례를 시작해보세요!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PixelButton to="/community" emoji="💬" color="secondary">
              커뮤니티 가기
            </PixelButton>
            <PixelButton to="/mypage" emoji="🎒" color="secondary">
              내 인벤토리
            </PixelButton>
            <PixelButton to="/ranking" emoji="🏆" color="secondary">
              랭킹 보기
            </PixelButton>
          </Box>
        </WoodPanel>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h2">
              🏰 {selectedDistrict ? `${selectedDistrict.emoji} ${selectedDistrict.name}` : '전체'} 빵집
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              label="전체"
              color={!selectedDistrictId ? 'primary' : 'default'}
              onClick={() => setSelectedDistrictId(null)}
            />
            {DISTRICTS.map((district) => (
              <Chip
                key={district.id}
                label={`${district.emoji} ${district.name}`}
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
