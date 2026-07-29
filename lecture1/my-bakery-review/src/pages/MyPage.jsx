import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import WoodPanel from '../components/common/WoodPanel'
import XpProgressBar from '../components/common/XpProgressBar'
import BadgeTile from '../components/common/BadgeTile'
import Reveal from '../components/common/Reveal'
import { MOCK_USER } from '../constants/userProfile'
import { BADGES } from '../constants/badges'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { getLevelProgress } from '../utils/levelUtils'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../constants/bakeryPhotos'
import { useBusanBakeries } from '../context/BusanBakeriesContext'
import { useVisitedBakeries } from '../context/VisitedBakeriesContext'
import { useRealBakeryPhotos } from '../context/RealBakeryPhotosContext'

const MyPage = () => {
  const visitedCount = MOCK_USER.visitedBakeryIds.length
  const progress = getLevelProgress(visitedCount, MOCK_USER.totalHearts)
  const visitedBakeries = BAKERIES.filter((b) => MOCK_USER.visitedBakeryIds.includes(b.id))

  const { bakeries: realBakeries } = useBusanBakeries()
  const { visitedIds: realVisitedIds } = useVisitedBakeries()
  const { photosByBakeryId } = useRealBakeryPhotos()
  const visitedRealBakeries = realBakeries.filter((b) => realVisitedIds.includes(b.id))

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          마이 인벤토리
        </Typography>

        <Reveal>
        <WoodPanel variant="light" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                flexShrink: 0,
                bgcolor: 'transparent',
                border: '3px solid #E3B873',
                boxShadow: '0 0 0 4px rgba(227,184,115,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                lineHeight: 1,
                overflow: 'hidden',
              }}
            >
              {progress.currentLevel.iconImage ? (
                <Box
                  component="img"
                  src={progress.currentLevel.iconImage}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                MOCK_USER.avatarEmoji
              )}
            </Box>
            <Box>
              <Typography variant="h2">{MOCK_USER.nickname}</Typography>
              <Typography variant="body2" color="text.secondary">
                {MOCK_USER.joinedAt} 가입 · 방문 {visitedCount}곳 · 하트 {MOCK_USER.totalHearts}개
              </Typography>
            </Box>
          </Box>
          <XpProgressBar
            levelEmoji={progress.currentLevel.emoji}
            levelIconImage={progress.currentLevel.iconImage}
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
        </Reveal>

        <Typography variant="h2" sx={{ mb: 2 }}>
          획득 배지 ({MOCK_USER.badgeIds.length}/{BADGES.length})
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
          {BADGES.map((badge, index) => (
            <Reveal key={badge.id} delay={Math.min(index * 0.05, 0.3)}>
              <BadgeTile {...badge} earned={MOCK_USER.badgeIds.includes(badge.id)} />
            </Reveal>
          ))}
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>
          방문한 빵집 ({visitedBakeries.length}곳)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visitedBakeries.map((bakery, index) => {
            const district = DISTRICTS.find((d) => d.id === bakery.districtId)
            return (
              <Reveal key={bakery.id} delay={Math.min(index * 0.05, 0.3)}>
              <WoodPanel
                variant="light"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 20px rgba(46,42,37,0.12)',
                    borderColor: 'rgba(46,42,37,0.16)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    component="img"
                    src={BAKERY_PHOTO_BY_ID[bakery.id] || DEFAULT_BAKERY_PHOTO}
                    alt={bakery.name}
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 2,
                      objectFit: 'cover',
                    }}
                  />
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
              </Reveal>
            )
          })}
        </Box>

        <Typography variant="h2" sx={{ mt: 4, mb: 2 }}>
          실제 방문 인증 빵집 ({visitedRealBakeries.length}곳)
        </Typography>
        {visitedRealBakeries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            아직 방문 인증한 진짜 빵집이 없어요. 빵집 상세 페이지에서 "다녀왔어요"를 눌러보세요.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {visitedRealBakeries.map((bakery, index) => {
              const district = DISTRICTS.find((d) => d.id === bakery.districtId)
              return (
                <Reveal key={bakery.id} delay={Math.min(index * 0.05, 0.3)}>
                  <WoodPanel
                    variant="light"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 10px 20px rgba(46,42,37,0.12)',
                        borderColor: 'rgba(46,42,37,0.16)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        component="img"
                        src={photosByBakeryId[bakery.id] || DEFAULT_BAKERY_PHOTO}
                        alt={bakery.name}
                        sx={{
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                          borderRadius: 2,
                          objectFit: 'cover',
                        }}
                      />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {bakery.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {district?.name} · {bakery.address}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label="방문 인증" size="small" color="primary" />
                  </WoodPanel>
                </Reveal>
              )
            })}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default MyPage
