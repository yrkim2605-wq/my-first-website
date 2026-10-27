import { useState } from 'react'
import { Box, Button, Container, Tab, Tabs, Typography } from '@mui/material'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { BEFORE_AFTER_TABS } from '../../constants/siteData'

const BeforeAfterSection = () => {
  // 선택된 탭의 id를 기억하는 상태
  const [activeTab, setActiveTab] = useState(BEFORE_AFTER_TABS[0].id)
  const current = BEFORE_AFTER_TABS.find((tab) => tab.id === activeTab)

  const handleTabChange = (_event, newTabId) => {
    setActiveTab(newTabId)
  }

  return (
    <Box id="before-after" sx={{ py: 10, scrollMarginTop: 64 }}>
      <Container maxWidth="md">
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 1 }}>
          Before &amp; After
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          시술 전후 결과를 확인해 보세요
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 4, '& .MuiTabs-flexContainer': { justifyContent: { md: 'center' } } }}
        >
          {BEFORE_AFTER_TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              시술 전
            </Typography>
            <ImagePlaceholder label="BEFORE" sx={{ height: { xs: 200, md: 320 }, borderRadius: 4, mt: 1 }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              시술 후
            </Typography>
            <ImagePlaceholder label="AFTER" sx={{ height: { xs: 200, md: 320 }, borderRadius: 4, mt: 1 }} />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, mb: 3 }}>
          {current.caption}
        </Typography>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" href="#clinic">
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

export default BeforeAfterSection
