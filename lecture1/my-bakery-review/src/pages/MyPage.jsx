import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import WoodPanel from '../components/common/WoodPanel'
import XpProgressBar from '../components/common/XpProgressBar'
import BadgeTile from '../components/common/BadgeTile'
import { MOCK_USER } from '../constants/userProfile'
import { BADGES } from '../constants/badges'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { getLevelProgress } from '../utils/levelUtils'

const MyPage = () => {
  const visitedCount = MOCK_USER.visitedBakeryIds.length
  const progress = getLevelProgress(visitedCount, MOCK_USER.totalHearts)
  const visitedBakeries = BAKERIES.filter((b) => MOCK_USER.visitedBakeryIds.includes(b.id))

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          마이 인벤토리
        </Typography>

        <WoodPanel variant="light" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>{MOCK_USER.avatarEmoji}</Typography>
            <Box>
              <Typography variant="h2">{MOCK_USER.nickname}</Typography>
              <Typography variant="body2" color="text.secondary">
                {MOCK_USER.joinedAt} 가입 · 방문 {visitedCount}곳 · 하트 {MOCK_USER.totalHearts}개
              </Typography>
            </Box>
          </Box>
          <XpProgressBar
            levelEmoji={progress.currentLevel.emoji}
            levelName={progress.currentLevel.name}
            nextLevelName={progress.nextLevel?.name}
            percent={progress.percent}
            visitsNeeded={progress.visitsNeeded}
            heartsNeeded={progress.heartsNeeded}
            isMaxLevel={progress.isMaxLevel}
          />
          <Typography variant="body2" sx={{ mt: 2, color: 'primary.main', fontWeight: 700 }}>
            현재 레벨 혜택: {progress.currentLevel.perk}
          </Typography>
        </WoodPanel>

        <Typography variant="h2" sx={{ mb: 2 }}>
          획득 배지
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: 2,
            mb: 4,
          }}
        >
          {BADGES.map((badge) => (
            <BadgeTile key={badge.id} {...badge} earned={MOCK_USER.badgeIds.includes(badge.id)} />
          ))}
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>
          방문한 빵집 ({visitedBakeries.length}곳)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visitedBakeries.map((bakery) => {
            const district = DISTRICTS.find((d) => d.id === bakery.districtId)
            return (
              <WoodPanel
                key={bakery.id}
                variant="light"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1.5rem' }}>{bakery.emoji}</Typography>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {bakery.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {district?.name} · {bakery.signatureMenu}
                    </Typography>
                  </Box>
                </Box>
                <Chip label="완료" size="small" color="primary" />
              </WoodPanel>
            )
          })}
        </Box>
      </Box>
    </Container>
  )
}

export default MyPage
