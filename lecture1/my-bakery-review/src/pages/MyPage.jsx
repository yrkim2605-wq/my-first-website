import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import AdventurerStatusWindow from '../components/mypage/AdventurerStatusWindow'
import QuestBoard from '../components/mypage/QuestBoard'
import BakeryCollection from '../components/mypage/BakeryCollection'
import MyLogList from '../components/mypage/MyLogList'
import BadgeTile from '../components/common/BadgeTile'
import LevelBookDialog from '../components/common/LevelBookDialog'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import WoodButton from '../components/common/WoodButton'
import Illustration from '../components/common/decor/Illustration'
import { DISTRICTS } from '../constants/districts'
import { getBakeryPhoto } from '../constants/bakeryPhotos'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { useGameState } from '../hooks/useGameState'
import { useDiscovery } from '../hooks/useDiscovery'
import { useVisitedBakeries } from '../hooks/useVisitedBakeries'
import { useRealBakeryPhotos } from '../hooks/useRealBakeryPhotos'
import { evaluateBadges } from '../utils/badgeRules'
import { DISPLAY_FONT, RADIUS } from '../theme'

const SUBHEAD_SX = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 1,
  color: 'primary.main',
  fontSize: { xs: '1.3rem', sm: '1.5rem' },
  mb: 2,
}

// "다녀왔어요" 체크한 빵집 한 줄 (누르면 빵집 상세로 가요)
const CheckedBakeryRow = ({ bakery, photoSrc }) => (
  <Box component="li" sx={{ borderBottom: '1px solid rgba(201,165,106,0.5)', '&:last-of-type': { borderBottom: 'none' } }}>
    <Box
      component={Link}
      to={`/bakery/${bakery.id}`}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: { xs: 1.5, sm: 2.5 }, py: 1.5, color: 'inherit', textDecoration: 'none', '&:hover .visited-name': { color: 'primary.main' } }}
    >
      <Box component="img" src={photoSrc} alt="" sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: RADIUS.round, objectFit: 'cover' }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography className="visited-name" sx={{ fontWeight: 700, transition: 'color 0.15s ease' }} noWrap>
          {bakery.name}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
          {DISTRICTS.find((district) => district.id === bakery.districtId)?.name} · {bakery.address}
        </Typography>
      </Box>
      <Chip label="내 체크" size="small" sx={{ bgcolor: 'rgba(143,166,126,0.2)', color: 'secondary.contrastText', fontWeight: 700 }} />
    </Box>
  </Box>
)

// 마이페이지 = 모험가 상태창. 모든 값은 이 브라우저에 저장된 모험 일지로 계산한 실제 값이에요.
const MyPage = () => {
  const [levelBookOpen, setLevelBookOpen] = useState(false)
  const game = useGameState()
  const discovery = useDiscovery()
  const { visitedIds } = useVisitedBakeries()
  const { photosByBakeryId } = useRealBakeryPhotos()

  const badges = useMemo(() => evaluateBadges(game.myReviews, discovery.discoveredCount), [game.myReviews, discovery.discoveredCount])
  const checkedBakeries = discovery.bakeries.filter((bakery) => visitedIds.includes(bakery.id))

  // 로그인하지 않았으면 상태창 대신 모험가 만들기 안내를 보여줘요
  if (!game.profile) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 6 } }}>
          <SectionHeading variant="sign" eyebrow="MY ADVENTURER" title="내 모험가 상태창" description="레벨, 퀘스트, 빵집 도감을 한곳에서 확인해요." sx={{ mb: 4 }} />
          <Box sx={{ ...PARCHMENT_SX, borderRadius: '24px', p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Illustration name="knightSleep" width={170} sx={{ mx: 'auto', mb: 1 }} />
            <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.3rem', color: 'primary.main', mb: 1 }}>
              아직 모험가가 없어요
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2.5, wordBreak: 'keep-all' }}>
              닉네임만 정하면 바로 시작할 수 있어요. 모험 일지를 남기면 EXP가 쌓이고 빵집 도감이 채워져요.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.25, justifyContent: 'center', flexWrap: 'wrap', mb: 2.5 }}>
              <WoodButton component={Link} to="/signup">
                새 모험가 만들기
              </WoodButton>
              <WoodButton component={Link} to="/login" showStar={false}>
                로그인
              </WoodButton>
            </Box>
            <LocalProfileNotice />
          </Box>
        </Box>
      </Container>
    )
  }

  const earnedBadgeCount = badges.filter((badge) => badge.earned).length

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 6 } }}>
        <SectionHeading
          variant="sign"
          eyebrow="MY ADVENTURER"
          title="내 모험가 상태창"
          description="레벨, 퀘스트, 빵집 도감, 모험 일지를 모아봤어요."
          sx={{ mb: { xs: 3, sm: 4 } }}
        />
        <LocalProfileNotice sx={{ mb: 3 }}>
          이 상태창의 기록은 <b>이 브라우저에만 저장</b>돼요. 다른 기기나 다른 사람과 공유되지 않고, 사이트 데이터를 지우면 사라져요.
        </LocalProfileNotice>

        <AdventurerStatusWindow game={game} discoveredCount={discovery.discoveredCount} onOpenLevelBook={() => setLevelBookOpen(true)} />

        <QuestBoard quests={game.quests} />

        <Typography variant="h2" sx={SUBHEAD_SX}>
          획득 배지
          <Box component="span" sx={{ fontFamily: 'inherit', fontSize: '1rem', color: 'terracotta.main' }}>
            {earnedBadgeCount}/{badges.length}
          </Box>
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2, mb: 6 }}>
          {badges.map((badge) => (
            <BadgeTile
              key={badge.id}
              emoji={badge.emoji}
              iconImage={badge.iconImage}
              name={badge.name}
              description={badge.description}
              earned={badge.earned}
              progressText={badge.earned ? undefined : `${badge.current}/${badge.target}`}
            />
          ))}
        </Box>

        <BakeryCollection discovery={discovery} />

        <MyLogList reviews={game.myReviews} />

        <Typography variant="h2" sx={SUBHEAD_SX}>
          다녀왔어요 체크한 빵집
          <Box component="span" sx={{ fontFamily: 'inherit', fontSize: '1rem', color: 'terracotta.main' }}>
            {checkedBakeries.length}곳
          </Box>
        </Typography>
        {checkedBakeries.length === 0 ? (
          <Box sx={{ border: '2px dashed rgba(201,165,106,0.9)', borderRadius: RADIUS.lg, px: 3, py: 3.5, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
            빵집 상세 페이지의 ‘다녀왔어요’로 나만 보는 체크를 남길 수 있어요. (확인할 수 없어서 EXP와 도감에는 반영되지 않아요)
          </Box>
        ) : (
          <Box component="ul" sx={{ ...PARCHMENT_SX, listStyle: 'none', m: 0, p: 0, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
            {checkedBakeries.map((bakery) => (
              <CheckedBakeryRow key={bakery.id} bakery={bakery} photoSrc={getBakeryPhoto(bakery.id, photosByBakeryId, bakery.photoSlot)} />
            ))}
          </Box>
        )}
      </Box>

      <LevelBookDialog open={levelBookOpen} onClose={() => setLevelBookOpen(false)} currentLevelId={game.progress.currentLevel.id} />
    </Container>
  )
}

export default MyPage
