import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CommunityPostCard from '../components/common/CommunityPostCard'
import Reveal from '../components/common/Reveal'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_POSTS } from '../constants/communityPosts'
import { FILTER_CHIP_SX } from '../constants/chipStyles'
import { getAuthorLevel } from '../utils/authorLevel'
import { getPostAvatarEmoji, getPostPhotoBakeryId } from '../utils/communityPostMeta'

const Community = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [sortBy, setSortBy] = useState('heart')

  const filteredPosts =
    selectedCategoryId === 'all'
      ? COMMUNITY_POSTS
      : COMMUNITY_POSTS.filter((post) => post.categoryId === selectedCategoryId)

  const sortedPosts = [...filteredPosts].sort((a, b) =>
    sortBy === 'heart' ? b.heartCount - a.heartCount : b.commentCount - a.commentCount,
  )

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          커뮤니티 게시판
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          오늘의 빵집 소식과 후기를 나눠보세요.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4 }}>
          <Chip
            label="전체"
            variant={selectedCategoryId === 'all' ? 'filled' : 'outlined'}
            color={selectedCategoryId === 'all' ? 'primary' : 'default'}
            onClick={() => setSelectedCategoryId('all')}
            sx={FILTER_CHIP_SX}
          />
          {COMMUNITY_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              label={category.label}
              variant={selectedCategoryId === category.id ? 'filled' : 'outlined'}
              color={selectedCategoryId === category.id ? 'primary' : 'default'}
              onClick={() => setSelectedCategoryId(category.id)}
              sx={FILTER_CHIP_SX}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <Box
            component="button"
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'heart' ? 'comment' : 'heart'))}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.25,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'text.secondary',
              transition: 'color 0.2s ease',
              '&:hover': { color: 'primary.main' },
            }}
          >
            {sortBy === 'heart' ? '좋아요순' : '댓글순'}
            <ArrowDropDownIcon />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {sortedPosts.map((post, index) => {
            const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
            return (
              <Reveal key={post.id} delay={Math.min((index % 8) * 0.05, 0.3)}>
                <CommunityPostCard
                  {...post}
                  categoryLabel={category?.label}
                  avatarEmoji={getPostAvatarEmoji(post)}
                  authorLevel={getAuthorLevel(post.author)}
                  photoBakeryId={getPostPhotoBakeryId(post)}
                />
              </Reveal>
            )
          })}
        </Box>
      </Box>
    </Container>
  )
}

export default Community
