import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import WoodPanel from '../components/common/WoodPanel'
import RankingListItem from '../components/common/RankingListItem'
import RankingPodium from '../components/common/RankingPodium'
import Reveal from '../components/common/Reveal'
import { MONTHLY_REVIEWERS, TOP_VISITORS, TOP_BAKERIES, TOP_LIKED_REVIEWS } from '../constants/ranking'
import { DISTRICTS } from '../constants/districts'
import { BAKERIES } from '../constants/bakeries'
import { REVIEW_COUNT_BY_BAKERY_ID } from '../constants/bakeryReviews'
import { getAuthorLevel } from '../utils/authorLevel'

const TOP_REVIEWED_BAKERIES = [...BAKERIES]
  .sort((a, b) => (REVIEW_COUNT_BY_BAKERY_ID[b.id] || 0) - (REVIEW_COUNT_BY_BAKERY_ID[a.id] || 0))
  .slice(0, 10)
  .map((bakery, index) => ({ ...bakery, rank: index + 1 }))

export const RANKING_TABS = [
  { label: '이번달 리뷰왕' },
  { label: '방문 많은 회원' },
  { label: '인기빵집 TOP 10' },
  { label: '리뷰 많은 빵집' },
  { label: '좋아요 많은 리뷰' },
]

const getRankingItems = (tabIndex) => {
  if (tabIndex === 0) {
    return MONTHLY_REVIEWERS.map((item) => ({
      rank: item.rank,
      emoji: item.avatarEmoji,
      avatarImage: getAuthorLevel(item.nickname).iconImage,
      primaryText: item.nickname,
      valueText: item.reviewCount,
      valueEmoji: '✍️',
    }))
  }
  if (tabIndex === 1) {
    return TOP_VISITORS.map((item) => ({
      rank: item.rank,
      emoji: item.avatarEmoji,
      avatarImage: getAuthorLevel(item.nickname).iconImage,
      primaryText: item.nickname,
      levelBadge: item.levelName,
      valueText: item.visitedCount,
      valueEmoji: '📍',
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
        valueEmoji: '❤️',
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
        valueEmoji: '✍️',
      }
    })
  }
  return TOP_LIKED_REVIEWS.map((item) => ({
    rank: item.rank,
    emoji: '📝',
    avatarImage: getAuthorLevel(item.author).iconImage,
    primaryText: item.bakeryName,
    secondaryText: `${item.author} · ${item.content}`,
    valueText: item.heartCount,
    valueEmoji: '❤️',
  }))
}

const parseTabParam = (value) => {
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 && index < RANKING_TABS.length ? index : 0
}

const Ranking = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => parseTabParam(searchParams.get('tab')))

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')))
  }, [searchParams])

  const items = getRankingItems(activeTab)
  const podiumItems = items.slice(0, 3)
  const restItems = items.slice(3)

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          랭킹
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {RANKING_TABS.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>

        <Reveal>
          <RankingPodium items={podiumItems} />
        </Reveal>

        <Reveal delay={0.1}>
          <WoodPanel variant="light" sx={{ p: 0 }}>
            {restItems.map((item) => (
              <RankingListItem key={item.rank} {...item} />
            ))}
          </WoodPanel>
        </Reveal>
      </Box>
    </Container>
  )
}

export default Ranking
