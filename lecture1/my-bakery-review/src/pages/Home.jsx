import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import BakeryStageCard from '../components/common/BakeryStageCard'
import HeroCarousel from '../components/common/HeroCarousel'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import heroImage1 from '../assets/hero/bakery-1.jpg'
import heroImage2 from '../assets/hero/bakery-2.jpg'

const HERO_IMAGES = [heroImage1, heroImage2]

const FILTER_CHIP_SX = {
  transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  '&:hover': {
    backgroundColor: '#332419 !important',
    color: '#F0EDE6 !important',
    borderColor: '#332419 !important',
  },
}

const Home = () => {
  const [selectedDistrictId, setSelectedDistrictId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredBakeries = BAKERIES.filter((b) => {
    const matchesDistrict = !selectedDistrictId || b.districtId === selectedDistrictId
    const matchesQuery =
      !normalizedQuery ||
      b.name.toLowerCase().includes(normalizedQuery) ||
      b.signatureMenu.toLowerCase().includes(normalizedQuery) ||
      b.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    return matchesDistrict && matchesQuery
  })

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: { xs: 6, sm: 10 } }}>
        <Box>
          <HeroCarousel images={HERO_IMAGES} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, sm: 5 }, mb: { xs: 8, sm: 12 } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="빵집 이름이나 메뉴를 검색해보세요"
            variant="standard"
            sx={{
              maxWidth: 420,
              width: '100%',
              '& .MuiInput-underline:before': {
                borderBottomColor: 'text.primary',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'primary.main',
              },
              '& .MuiInput-underline:after': {
                borderBottomColor: 'primary.main',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
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
              sx={FILTER_CHIP_SX}
            />
            {DISTRICTS.map((district) => (
              <Chip
                key={district.id}
                label={district.name}
                variant={selectedDistrictId === district.id ? 'filled' : 'outlined'}
                color={selectedDistrictId === district.id ? 'primary' : 'default'}
                onClick={() => setSelectedDistrictId(district.id)}
                sx={FILTER_CHIP_SX}
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
