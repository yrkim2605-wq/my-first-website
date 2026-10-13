import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CommunityPostListItem from '../components/common/CommunityPostListItem'
import StatusMessage from '../components/common/StatusMessage'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_POSTS } from '../constants/communityPosts'
import { getPostPhotoBakeryId } from '../utils/communityPostMeta'
import { getAuthorLevel } from '../utils/authorLevel'

const SORT_OPTIONS = [
  { id: 'heart', label: '좋아요순' },
  { id: 'comment', label: '댓글순' },
]

const CATEGORY_TABS = [{ id: 'all', label: '전체' }, ...COMMUNITY_CATEGORIES]

const Community = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategoryId = searchParams.get('category') || 'all'
  const [sortBy, setSortBy] = useState('heart')

  // 선택한 카테고리는 주소(?category=)에만 저장해요. 헤더 메뉴로 들어와도, 탭을 눌러도 같은 값을 봐요.
  const handleSelectCategory = (_, categoryId) => {
    setSearchParams(categoryId === 'all' ? {} : { category: categoryId }, { replace: true })
  }

  const filteredPosts =
    selectedCategoryId === 'all'
      ? COMMUNITY_POSTS
      : COMMUNITY_POSTS.filter((post) => post.categoryId === selectedCategoryId)

  const sortedPosts = [...filteredPosts].sort((a, b) =>
    sortBy === 'heart' ? b.heartCount - a.heartCount : b.commentCount - a.commentCount,
  )

  const isKnownCategory = CATEGORY_TABS.some((c) => c.id === selectedCategoryId)

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 8, sm: 10 } }}>
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'primary.main',
            mb: 1,
          }}
        >
          COMMUNITY
        </Typography>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' }, fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}
        >
          커뮤니티
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: { xs: 3, sm: 4 } }}>
          부산 빵집에서 있었던 일, 새로 나온 메뉴, 오픈런 후기를 나눠요.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: '1px solid rgba(46,42,37,0.12)',
          }}
        >
          <Tabs
            value={isKnownCategory ? selectedCategoryId : 'all'}
            onChange={handleSelectCategory}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                minWidth: 0,
                px: 0,
                mr: 3,
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'text.secondary',
              },
              '& .Mui-selected': { color: 'text.primary' },
              '& .MuiTabs-indicator': { height: 2, bgcolor: 'text.primary' },
            }}
          >
            {CATEGORY_TABS.map((category) => (
              <Tab key={category.id} value={category.id} label={category.label} disableRipple />
            ))}
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2.5,
            pb: 0.5,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            글 {sortedPosts.length}개
          </Typography>
          <Box role="group" aria-label="정렬" sx={{ display: 'flex', gap: 1.5 }}>
            {SORT_OPTIONS.map((option) => (
              <Box
                key={option.id}
                component="button"
                type="button"
                aria-pressed={sortBy === option.id}
                onClick={() => setSortBy(option.id)}
                sx={{
                  border: 'none',
                  background: 'none',
                  p: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: sortBy === option.id ? 700 : 500,
                  color: sortBy === option.id ? 'text.primary' : 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {option.label}
              </Box>
            ))}
          </Box>
        </Box>

        {sortedPosts.length === 0 ? (
          <StatusMessage
            title="아직 글이 없어요"
            description="이 카테고리의 첫 글을 기다리고 있어요."
            actionLabel="전체 글 보기"
            onAction={() => handleSelectCategory(null, 'all')}
            sx={{ mt: 3 }}
          />
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {sortedPosts.map((post) => {
              const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
              return (
                <Box component="li" key={post.id}>
                  <CommunityPostListItem
                    {...post}
                    categoryLabel={category?.label}
                    authorLevel={getAuthorLevel(post.author)}
                    photoBakeryId={getPostPhotoBakeryId(post)}
                  />
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default Community
