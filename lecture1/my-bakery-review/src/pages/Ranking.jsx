import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import RankingListItem from '../components/common/RankingListItem'
import RankingPodium from '../components/common/RankingPodium'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import MyRecordCard from '../components/ranking/MyRecordCard'
import LocalRankingBoard from '../components/ranking/LocalRankingBoard'
import AccountRankingBoard from '../components/ranking/AccountRankingBoard'
import Typography from '@mui/material/Typography'
import { DISPLAY_FONT } from '../theme'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { MONTHLY_REVIEWERS, TOP_VISITORS, TOP_BAKERIES, TOP_LIKED_REVIEWS } from '../constants/ranking'
import { ACTIVE_RANKING_TABS } from '../constants/rankingTabs'
import { IS_ACCOUNT_MODE } from '../lib/backend'
import { DISTRICTS } from '../constants/districts'
import { BAKERIES } from '../constants/bakeries'
import { REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { getAuthorLevel } from '../utils/authorLevel'
import { PAGE_TABS_SX } from '../constants/tabStyles'

const TOP_REVIEWED_BAKERIES = [...BAKERIES]
  .sort((a, b) => (REVIEW_COUNT_BY_BAKERY_ID[b.id] || 0) - (REVIEW_COUNT_BY_BAKERY_ID[a.id] || 0))
  .slice(0, 10)
  .map((bakery, index) => ({ ...bakery, rank: index + 1 }))

const getRankingItems = (tabIndex) => {
  if (tabIndex === 0) {
    return MONTHLY_REVIEWERS.map((item) => ({
      rank: item.rank,
      emoji: item.avatarEmoji,
      avatarImage: getAuthorLevel(item.nickname).iconImage,
      avatarScale: getAuthorLevel(item.nickname).iconScale,
      primaryText: item.nickname,
      valueText: item.reviewCount,
      valueKind: 'review',
    }))
  }
  if (tabIndex === 1) {
    return TOP_VISITORS.map((item) => ({
      rank: item.rank,
      emoji: item.avatarEmoji,
      avatarImage: getAuthorLevel(item.nickname).iconImage,
      avatarScale: getAuthorLevel(item.nickname).iconScale,
      primaryText: item.nickname,
      levelBadge: item.levelName,
      valueText: item.visitedCount,
      valueKind: 'visit',
    }))
  }
  if (tabIndex === 2) {
    return TOP_BAKERIES.map((item) => {
      const district = DISTRICTS.find((d) => d.id === item.districtId)
      return {
        rank: item.rank,
        emoji: item.emoji,
        avatarImage: BAKERIES.find((b) => b.name === item.name)?.iconImage,
        primaryText: item.name,
        secondaryText: district?.name,
        valueText: item.heartCount,
        valueKind: 'heart',
      }
    })
  }
  if (tabIndex === 3) {
    return TOP_REVIEWED_BAKERIES.map((item) => {
      const district = DISTRICTS.find((d) => d.id === item.districtId)
      return {
        rank: item.rank,
        emoji: item.emoji,
        avatarImage: item.iconImage,
        primaryText: item.name,
        secondaryText: district?.name,
        valueText: REVIEW_COUNT_BY_BAKERY_ID[item.id] || 0,
        valueKind: 'review',
      }
    })
  }
  return TOP_LIKED_REVIEWS.map((item) => ({
    rank: item.rank,
    emoji: '📝',
    avatarImage: getAuthorLevel(item.author).iconImage,
    avatarScale: getAuthorLevel(item.author).iconScale,
    primaryText: item.bakeryName,
    secondaryText: `${item.author} · ${item.content}`,
    valueText: item.heartCount,
    valueKind: 'heart',
  }))
}

const parseTabParam = (value) => {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 && index < ACTIVE_RANKING_TABS.length ? index : 0
}

const Ranking = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseTabParam(searchParams.get('tab'))

  // 선택한 탭은 주소(?tab=)에만 저장해요. 헤더 메뉴로 들어와도, 탭을 눌러도 같은 값을 봐요.
  const handleChangeTab = (_, value) => {
    setSearchParams({ tab: String(value) }, { replace: true })
  }

  // 로컬 모드: 예시 순위표 / 계정 모드: 서버의 실제 순위 (AccountRankingBoard가 따로 불러와요)
  const items = IS_ACCOUNT_MODE ? [] : getRankingItems(activeTab)
  const podiumItems = items.slice(0, 3)
  const restItems = items.slice(3)

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 6 } }}>
        <SectionHeading
          variant="sign"
          eyebrow="HALL OF FAME"
          title="이번 달 명예의 전당"
          flank={{ left: { name: 'medal-gold', width: 62, float: true, lift: 40, inward: 30 } }}
          description={IS_ACCOUNT_MODE ? '모든 모험가의 실제 기록으로 계산한 순위예요.' : '내 기록과 이 브라우저의 실제 순위, 그리고 예시 순위표를 볼 수 있어요.'}
          sx={{ mb: { xs: 3, sm: 4 } }}
        />

        {IS_ACCOUNT_MODE ? (
          <>
            <LocalProfileNotice
              sx={{ mb: 2 }}
              accountChildren={
                <>
                  여기 순위는 모두 <b>서버에 저장된 실제 기록</b>으로 계산한 값이고, 예시 데이터는 섞이지 않아요. 닉네임 · 레벨 · EXP · 일지/좋아요
                  수만 공개되고 이메일 같은 개인 정보는 보이지 않아요.
                </>
              }
            />
            <MyRecordCard />

            <Tabs
              value={activeTab}
              onChange={handleChangeTab}
              variant="scrollable"
              scrollButtons={false}
              sx={{ ...PAGE_TABS_SX, mb: { xs: 2, sm: 3 } }}
            >
              {ACTIVE_RANKING_TABS.map((tab) => (
                <Tab key={tab.id} label={tab.label} disableRipple />
              ))}
            </Tabs>

            <AccountRankingBoard key={ACTIVE_RANKING_TABS[activeTab].id} boardId={ACTIVE_RANKING_TABS[activeTab].id} label={ACTIVE_RANKING_TABS[activeTab].label} />
          </>
        ) : (
          <>
            {/* 순위표는 예시 데이터라는 점을 분명히 알려요. "내 기록"만 실제로 계산한 값이에요. */}
            <LocalProfileNotice always sx={{ mb: 2 }}>
              <b>‘내 기록’과 ‘이 브라우저의 모험가 순위’는 저장된 일지로 계산한 실제 값</b>이에요. 서버가 없어서 다른 기기 · 다른 사람의 기록은 들어 있지 않아요. 맨 아래 탭 순위표는 <b>예시 데이터</b>예요.
            </LocalProfileNotice>
            <MyRecordCard />
            <LocalRankingBoard />

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
              <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: 'primary.main' }}>
                모험가 예시 순위표
              </Typography>
              <Box component="span" sx={{ px: 1, py: 0.1, borderRadius: 999, border: '1px dashed', borderColor: 'text.secondary', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 800 }}>
                예시 데이터
              </Box>
            </Box>

            <Tabs
              value={activeTab}
              onChange={handleChangeTab}
              variant="scrollable"
              scrollButtons={false}
              sx={{ ...PAGE_TABS_SX, mb: { xs: 4, sm: 6 } }}
            >
              {ACTIVE_RANKING_TABS.map((tab) => (
                <Tab key={tab.label} label={tab.label} disableRipple />
              ))}
            </Tabs>

            <RankingPodium items={podiumItems} />

            {restItems.length > 0 && (
              <Box
                component="ol"
                start={4}
                sx={{
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  ...PARCHMENT_SX,
                  borderRadius: '18px',
                  overflow: 'hidden',
                }}
              >
                {restItems.map((item) => (
                  <RankingListItem key={item.rank} {...item} />
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  )
}

export default Ranking
