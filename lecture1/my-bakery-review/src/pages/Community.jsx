import { useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CommunityPostCard from '../components/common/CommunityPostCard'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_POSTS } from '../constants/communityPosts'

const Community = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')

  const filteredPosts =
    selectedCategoryId === 'all'
      ? COMMUNITY_POSTS
      : COMMUNITY_POSTS.filter((post) => post.categoryId === selectedCategoryId)

  return (
    <Container maxWidth="lg">
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
          />
          {COMMUNITY_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              label={category.label}
              variant={selectedCategoryId === category.id ? 'filled' : 'outlined'}
              color={selectedCategoryId === category.id ? 'primary' : 'default'}
              onClick={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredPosts.map((post) => {
            const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
            return (
              <CommunityPostCard
                key={post.id}
                {...post}
                categoryLabel={category?.label}
              />
            )
          })}
        </Box>
      </Box>
    </Container>
  )
}

export default Community
