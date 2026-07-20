import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import WoodPanel from '../components/common/WoodPanel'
import RankingListItem from '../components/common/RankingListItem'
import { MONTHLY_REVIEWERS, TOP_VISITORS, TOP_BAKERIES, TOP_LIKED_REVIEWS } from '../constants/ranking'
import { DISTRICTS } from '../constants/districts'

const TABS = [
  { label: '이번달 리뷰왕', emoji: '✍️' },
  { label: '방문 많은 회원', emoji: '📍' },
  { label: '인기빵집 TOP 10', emoji: '🥐' },
  { label: '좋아요 많은 리뷰', emoji: '❤️' },
]

const Ranking = () => {
  const [activeTab, setActiveTab] = useState(0)

  const renderPanel = () => {
    if (activeTab === 0) {
      return MONTHLY_REVIEWERS.map((item) => (
        <RankingListItem
          key={item.rank}
          rank={item.rank}
          emoji={item.avatarEmoji}
          primaryText={item.nickname}
          valueText={item.reviewCount}
          valueEmoji="✍️"
        />
      ))
    }
    if (activeTab === 1) {
      return TOP_VISITORS.map((item) => (
        <RankingListItem
          key={item.rank}
          rank={item.rank}
          emoji={item.avatarEmoji}
          primaryText={item.nickname}
          secondaryText={item.levelName}
          valueText={item.visitedCount}
          valueEmoji="📍"
        />
      ))
    }
    if (activeTab === 2) {
      return TOP_BAKERIES.map((item) => {
        const district = DISTRICTS.find((d) => d.id === item.districtId)
        return (
          <RankingListItem
            key={item.rank}
            rank={item.rank}
            emoji={item.emoji}
            primaryText={item.name}
            secondaryText={district?.name}
            valueText={item.heartCount}
            valueEmoji="❤️"
          />
        )
      })
    }
    return TOP_LIKED_REVIEWS.map((item) => (
      <RankingListItem
        key={item.rank}
        rank={item.rank}
        emoji="📝"
        primaryText={item.bakeryName}
        secondaryText={`${item.author} · ${item.content}`}
        valueText={item.heartCount}
        valueEmoji="❤️"
      />
    ))
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          🏆 랭킹
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.label} label={`${tab.emoji} ${tab.label}`} />
          ))}
        </Tabs>

        <WoodPanel variant="light" sx={{ p: 0 }}>
          {renderPanel()}
        </WoodPanel>
      </Box>
    </Container>
  )
}

export default Ranking
