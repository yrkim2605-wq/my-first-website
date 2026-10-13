import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import RankingListItem from '../components/common/RankingListItem'
import RankingPodium from '../components/common/RankingPodium'
import SectionHeading from '../components/common/SectionHeading'
import { MONTHLY_REVIEWERS, TOP_VISITORS, TOP_BAKERIES, TOP_LIKED_REVIEWS, RANKING_TABS } from '../constants/ranking'
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
  return Number.isInteger(index) && index >= 0 && index < RANKING_TABS.length ? index : 0
}

const Ranking = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseTabParam(searchParams.get('tab'))

  // 선택한 탭은 주소(?tab=)에만 저장해요. 헤더 메뉴로 들어와도, 탭을 눌러도 같은 값을 봐요.
  const handleChangeTab = (_, value) => {
    setSearchParams({ tab: String(value) }, { replace: true })
  }

  const items = getRankingItems(activeTab)
  const podiumItems = items.slice(0, 3)
  const restItems = items.slice(3)

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 6 } }}>
        <SectionHeading
          eyebrow="RANKING"
          title="이번 달 빵덕후 랭킹"
          description="리뷰와 방문으로 쌓은 이번 달 순위예요."
          sx={{ mb: { xs: 3, sm: 4 } }}
        />

        <Tabs
          value={activeTab}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons={false}
          sx={{ ...PAGE_TABS_SX, mb: { xs: 4, sm: 6 } }}
        >
          {RANKING_TABS.map((tab) => (
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
              bgcolor: 'background.paper',
              border: '1px solid rgba(59,42,34,0.08)',
              borderRadius: '18px',
              overflow: 'hidden',
            }}
          >
            {restItems.map((item) => (
              <RankingListItem key={item.rank} {...item} />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default Ranking
