import { useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import XpProgressBar from '../components/common/XpProgressBar'
import BadgeTile from '../components/common/BadgeTile'
import LevelBookDialog from '../components/common/LevelBookDialog'
import SectionHeading from '../components/common/SectionHeading'
import { MOCK_USER } from '../constants/userProfile'
import { BADGES } from '../constants/badges'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { useGameState } from '../hooks/useGameState'
import { getBakeryPhoto } from '../constants/bakeryPhotos'
import { useBusanBakeries } from '../hooks/useBusanBakeries'
import { useVisitedBakeries } from '../hooks/useVisitedBakeries'
import { useRealBakeryPhotos } from '../hooks/useRealBakeryPhotos'
import { DISPLAY_FONT, RADIUS } from '../theme'

const SUBHEAD_SX = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 1,
  color: 'primary.main',
  fontSize: { xs: '1.3rem', sm: '1.5rem' },
  mb: 2,
}

const LIST_PANEL_SX = {
  listStyle: 'none',
  m: 0,
  p: 0,
  bgcolor: 'background.paper',
  border: '1px solid rgba(59,42,34,0.08)',
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
}

const DONE_CHIP_SX = { bgcolor: 'rgba(143,166,126,0.2)', color: 'secondary.contrastText', fontWeight: 700 }

// 방문한 빵집 목록의 한 줄 (누르면 빵집 상세로 가요)
const VisitedBakeryRow = ({ bakery, photoSrc, caption, chipLabel }) => (
  <Box component="li" sx={{ borderBottom: '1px solid rgba(59,42,34,0.08)', '&:last-of-type': { borderBottom: 'none' } }}>
    <Box
      component={Link}
      to={`/bakery/${bakery.id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        px: { xs: 1.5, sm: 2.5 },
        py: 1.5,
        color: 'inherit',
        textDecoration: 'none',
        '&:hover .visited-name': { color: 'primary.main' },
      }}
    >
      <Box
        component="img"
        src={photoSrc}
        alt=""
        sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: RADIUS.round, objectFit: 'cover' }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography className="visited-name" sx={{ fontWeight: 700, transition: 'color 0.15s ease' }} noWrap>
          {bakery.name}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
          {caption}
        </Typography>
      </Box>
      <Chip label={chipLabel} size="small" sx={DONE_CHIP_SX} />
    </Box>
  </Box>
)

const MyPage = () => {
  const [levelBookOpen, setLevelBookOpen] = useState(false)
  const visitedCount = MOCK_USER.visitedBakeryIds.length
  const { progress } = useGameState()
  const visitedBakeries = BAKERIES.filter((b) => MOCK_USER.visitedBakeryIds.includes(b.id))

  const { bakeries: realBakeries } = useBusanBakeries()
  const { visitedIds: realVisitedIds } = useVisitedBakeries()
  const { photosByBakeryId } = useRealBakeryPhotos()
  const visitedRealBakeries = realBakeries.filter((b) => realVisitedIds.includes(b.id))

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 6 } }}>
        <SectionHeading
          variant="sign"
          eyebrow="MY ADVENTURER"
          title="내 모험가 상태창"
          description="내 레벨과 배지, 다녀온 빵집을 모아봤어요."
          sx={{ mb: { xs: 4, sm: 5 } }}
        />

        {/* 프로필 · 레벨 카드 */}
        <Box sx={{ bgcolor: 'butter.main', color: 'butter.contrastText', borderRadius: RADIUS.lg, p: { xs: 2.5, sm: 3.5 }, mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 104,
                height: 104,
                // 메달이 있으면 동그랗게 자르지 않아요 (리본 · 왕관이 잘리지 않게)
                borderRadius: progress.currentLevel.iconImage ? 0 : RADIUS.round,
                flexShrink: 0,
                bgcolor: progress.currentLevel.iconImage ? 'transparent' : 'background.paper',
                display: 'grid',
                placeItems: 'center',
                overflow: progress.currentLevel.iconImage ? 'visible' : 'hidden',
                fontSize: '2.2rem',
              }}
            >
              {progress.currentLevel.iconImage ? (
                <Box component="img" src={progress.currentLevel.iconImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${progress.currentLevel.iconScale ?? 1})` }} />
              ) : (
                MOCK_USER.avatarEmoji
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.6rem', color: 'text.primary' }}>
                {MOCK_USER.nickname}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {MOCK_USER.joinedAt} 가입 · 방문 {visitedCount}곳 · 하트 {MOCK_USER.totalHearts}개
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBookIcon />}
              onClick={() => setLevelBookOpen(true)}
              sx={{ ml: 'auto', borderRadius: RADIUS.pill, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
            >
              레벨북
            </Button>
          </Box>
          <XpProgressBar
            levelName={progress.currentLevel.name}
            nextLevelName={progress.nextLevel?.name}
            percent={progress.percent}
            exp={progress.exp}
            expToNext={progress.expToNext}
            isMaxLevel={progress.isMaxLevel}
          />
          <Typography sx={{ mt: 2, fontSize: '0.875rem', fontWeight: 700, color: 'primary.main' }}>
            예정 혜택 · {progress.currentLevel.perk}
          </Typography>
        </Box>

        <Typography variant="h2" sx={SUBHEAD_SX}>
          획득 배지
          <Box component="span" sx={{ fontFamily: 'inherit', fontSize: '1rem', color: 'terracotta.main' }}>
            {MOCK_USER.badgeIds.length}/{BADGES.length}
          </Box>
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 6,
          }}
        >
          {BADGES.map((badge) => (
            <BadgeTile key={badge.id} {...badge} earned={MOCK_USER.badgeIds.includes(badge.id)} />
          ))}
        </Box>

        <Typography variant="h2" sx={SUBHEAD_SX}>
          방문한 빵집
          <Box component="span" sx={{ fontFamily: 'inherit', fontSize: '1rem', color: 'terracotta.main' }}>
            {visitedBakeries.length}곳
          </Box>
        </Typography>
        <Box component="ul" sx={{ ...LIST_PANEL_SX, mb: 6 }}>
          {visitedBakeries.map((bakery) => (
            <VisitedBakeryRow
              key={bakery.id}
              bakery={bakery}
              photoSrc={getBakeryPhoto(bakery.id)}
              caption={`${DISTRICTS.find((d) => d.id === bakery.districtId)?.name} · ${bakery.signatureMenu}`}
              chipLabel="완료"
            />
          ))}
        </Box>

        <Typography variant="h2" sx={SUBHEAD_SX}>
          방문 인증한 빵집
          <Box component="span" sx={{ fontFamily: 'inherit', fontSize: '1rem', color: 'terracotta.main' }}>
            {visitedRealBakeries.length}곳
          </Box>
        </Typography>
        {visitedRealBakeries.length === 0 ? (
          <Box
            sx={{
              border: '1px dashed rgba(59,42,34,0.25)',
              borderRadius: RADIUS.lg,
              px: 3,
              py: 3.5,
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.9rem',
            }}
          >
            아직 방문 인증한 빵집이 없어요. 빵집 상세 페이지에서 "다녀왔어요"를 눌러보세요.
          </Box>
        ) : (
          <Box component="ul" sx={LIST_PANEL_SX}>
            {visitedRealBakeries.map((bakery) => (
              <VisitedBakeryRow
                key={bakery.id}
                bakery={bakery}
                photoSrc={getBakeryPhoto(bakery.id, photosByBakeryId, bakery.photoSlot)}
                caption={`${DISTRICTS.find((d) => d.id === bakery.districtId)?.name} · ${bakery.address}`}
                chipLabel="방문 인증"
              />
            ))}
          </Box>
        )}
      </Box>

      <LevelBookDialog
        open={levelBookOpen}
        onClose={() => setLevelBookOpen(false)}
        currentLevelId={progress.currentLevel.id}
      />
    </Container>
  )
}

export default MyPage
