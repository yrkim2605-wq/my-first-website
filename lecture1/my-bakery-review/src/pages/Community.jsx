import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CommunityPostListItem from '../components/common/CommunityPostListItem'
import StatusMessage from '../components/common/StatusMessage'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_POSTS } from '../constants/communityPosts'
import { getPostPhotoBakeryId } from '../utils/communityPostMeta'
import { getAuthorLevel } from '../utils/authorLevel'
import { PAGE_TABS_SX } from '../constants/tabStyles'

const SORT_OPTIONS = [
  { id: 'latest', label: '최신순' },
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

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'latest') return b.createdAt.localeCompare(a.createdAt) || b.id - a.id
    return sortBy === 'heart' ? b.heartCount - a.heartCount : b.commentCount - a.commentCount
  })

  const isKnownCategory = CATEGORY_TABS.some((c) => c.id === selectedCategoryId)

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 5, sm: 7 }, pb: { xs: 8, sm: 10 } }}>
        <SectionHeading
          variant="sign"
          eyebrow="ADVENTURERS' SQUARE"
          title="모험가 광장"
          description="부산 빵집에서 있었던 일, 새로 나온 메뉴, 오픈런 후기를 나눠요."
          sx={{ mb: { xs: 3, sm: 4 } }}
        />

        {/* 정직한 안내: 게시판 글은 예시이고, 글쓰기 기능은 아직 없어요 */}
        <LocalProfileNotice always sx={{ mb: 3 }}>
          게시판의 글은 모두 <b>예시 데이터</b>예요. 아직 글쓰기 기능은 없고, 글 상세의 댓글도 이 화면에서만 보여요(저장되지 않아요).
        </LocalProfileNotice>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Tabs
            value={isKnownCategory ? selectedCategoryId : 'all'}
            onChange={handleSelectCategory}
            variant="scrollable"
            scrollButtons={false}
            sx={PAGE_TABS_SX}
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
            pt: 1,
            pb: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
            글 {sortedPosts.length}개
          </Typography>
          <Box role="group" aria-label="정렬" sx={{ display: 'flex', gap: 0.5, mr: -1.25 }}>
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
                  minHeight: 44,
                  px: 1.25,
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
