import { useState } from 'react'
import { Box, Button, Container, IconButton, Tab, Tabs, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { BEFORE_AFTER_TABS } from '../../constants/siteData'

// 탭마다 보여 줄 시술 사례 수 (사진이 들어오기 전까지는 같은 회색 박스를 돌려 써요)
const CASE_COUNT = 3

// 시술 전/후 라벨이 붙은 사진 한 장 (카드 안에 들어가요)
const CaseImage = ({ sx }) => (
  <Box sx={{ position: 'relative', ...sx }}>
    <ImagePlaceholder sx={{ width: '100%', height: '100%', borderRadius: 1 }} />
    {['시술 전', '시술 후'].map((text, index) => (
      <Box
        key={text}
        sx={{
          position: 'absolute',
          top: 12,
          left: index === 0 ? 12 : 'auto',
          right: index === 1 ? 12 : 'auto',
          px: 1.5,
          py: 0.25,
          borderRadius: 5,
          bgcolor: 'primary.dark',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {text}
      </Box>
    ))}
  </Box>
)

const CARD_SX = {
  bgcolor: 'white',
  borderRadius: 2,
  p: 1.5,
  boxShadow: '0 8px 28px rgba(11, 79, 74, 0.14)',
}

const BeforeAfterSection = () => {
  // 선택된 탭의 id와 지금 가운데에 보여 주는 사례 번호를 기억하는 상태
  const [activeTab, setActiveTab] = useState(BEFORE_AFTER_TABS[0].id)
  const [caseIndex, setCaseIndex] = useState(0)
  const current = BEFORE_AFTER_TABS.find((tab) => tab.id === activeTab)

  const handleTabChange = (_event, newTabId) => {
    setActiveTab(newTabId)
    setCaseIndex(0)
  }
  const handlePrev = () => {
    setCaseIndex((index) => (index - 1 + CASE_COUNT) % CASE_COUNT)
  }
  const handleNext = () => {
    setCaseIndex((index) => (index + 1) % CASE_COUNT)
  }

  return (
    <Box id="before-after" sx={{ py: 10, scrollMarginTop: 64 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 1 }}>
          Before &amp; After
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          시술 전후 결과를 확인해 보세요
        </Typography>

        {/* 알약 모양 탭: 선택된 탭만 진한 색으로 채워요 */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          slotProps={{ indicator: { sx: { display: 'none' } } }}
          sx={{
            mb: 5,
            '& .MuiTabs-flexContainer': { justifyContent: { md: 'center' }, gap: 1 },
            '& .MuiTab-root': {
              minHeight: 32,
              px: 3,
              py: 0.5,
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 600,
            },
            '& .Mui-selected': { bgcolor: 'primary.dark', color: 'white !important' },
          }}
        >
          {BEFORE_AFTER_TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>

        {/* 가운데 큰 카드 + 양옆 작은 카드 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Box sx={{ ...CARD_SX, display: { xs: 'none', md: 'block' }, flex: 1, opacity: 0.6 }}>
            <CaseImage sx={{ height: 220 }} />
          </Box>

          <Box sx={{ position: 'relative', flex: { xs: 1, md: 2 }, minWidth: 0 }}>
            <Box sx={CARD_SX}>
              <CaseImage sx={{ height: { xs: 260, md: 420 } }} />
            </Box>
            <IconButton
              onClick={handlePrev}
              aria-label="이전 사례"
              sx={{ ...ARROW_SX, left: { xs: 8, md: -20 } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              aria-label="다음 사례"
              sx={{ ...ARROW_SX, right: { xs: 8, md: -20 } }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ ...CARD_SX, display: { xs: 'none', md: 'block' }, flex: 1, opacity: 0.6 }}>
            <CaseImage sx={{ height: 220 }} />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, mb: 3 }}>
          {current.caption} ({caseIndex + 1}/{CASE_COUNT})
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" href="#clinic" sx={{ bgcolor: 'primary.dark' }}>
            시술 결과 더보기
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
          * 위 이미지는 참고용이며, 같은 시술이라도 사람에 따라 결과는 다양하게 나타날 수 있습니다.
          <br />* 시술에 따른 부작용이 발생할 수 있습니다.
        </Typography>
      </Container>
    </Box>
  )
}

// 가운데 카드 양옆에 걸치는 동그란 화살표 버튼
const ARROW_SX = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  bgcolor: 'white',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
  '&:hover': { bgcolor: 'white' },
}

export default BeforeAfterSection
