import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CommunityPostListItem from '../components/common/CommunityPostListItem'
import StatusMessage from '../components/common/StatusMessage'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import WoodButton from '../components/common/WoodButton'
import LoadMoreFooter from '../components/common/LoadMoreFooter'
import LeftoverPhotosNotice from '../components/community/LeftoverPhotosNotice'
import { useNavigationNotice } from '../hooks/useNavigationNotice'
import Alert from '@mui/material/Alert'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_POSTS } from '../constants/communityPosts'
import { getPostPhotoBakeryId } from '../utils/communityPostMeta'
import { getAuthorLevel } from '../utils/authorLevel'
import { formatPostDate, levelFromIndex } from '../utils/communityFormat'
import { PAGE_TABS_SX } from '../constants/tabStyles'
import { IS_ACCOUNT_MODE, getBackendConfigProblem } from '../lib/backend'
import { communityRepository } from '../storage/communityRepository'
import { POST_PAGE_SIZE } from '../storage/supabaseCommunityRepository'
import { mergePostPages } from '../utils/communityPaging'
import { useProfile } from '../hooks/useProfile'

const SORT_OPTIONS = [
  { id: 'latest', label: '최신순' },
  { id: 'heart', label: '좋아요순' },
  { id: 'comment', label: '댓글순' },
]

const CATEGORY_TABS = [{ id: 'all', label: '전체' }, ...COMMUNITY_CATEGORIES]

const Community = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile, ready } = useProfile()
  const selectedCategoryId = searchParams.get('category') || 'all'
  // 예시 글은 좋아요순이 보기 좋고, 실제 글은 새 글이 먼저 보이는 최신순이 자연스러워요
  const [sortBy, setSortBy] = useState(IS_ACCOUNT_MODE ? 'latest' : 'heart')
  const [retryCount, setRetryCount] = useState(0)
  const [navNotice, dismissNavNotice] = useNavigationNotice() // 글 삭제 뒤 "사진 파일을 못 지웠어요" 같은 안내
  // 정리하지 못해 서버에 남은 내 사진 파일 (이 브라우저에 기록된 것) — 있으면 알려주고 다시 정리할 수 있어요
  const [leftoverPhotos, setLeftoverPhotos] = useState([])
  const [cleaningUp, setCleaningUp] = useState(false)

  const isKnownCategory = CATEGORY_TABS.some((c) => c.id === selectedCategoryId)
  const userId = profile?.userId ?? null

  // 계정 모드: 서버의 실제 글을 불러와요. 어떤 조건의 결과인지(key)를 같이 들고 있어서,
  // 조건이 바뀌면 이전 결과가 새 조건의 결과처럼 보이지 않고 "불러오는 중"이 돼요.
  const requestKey = `${isKnownCategory ? selectedCategoryId : 'all'}|${sortBy}|${userId}|${retryCount}`
  const [result, setResult] = useState({ key: null, posts: [], hasMore: false, total: null, errorMessage: null })
  // "더 보기"로 다음 쪽을 불러오는 중인지 / 실패했는지 (이미 보이는 글은 그대로 두고 아래에만 안내해요)
  const [more, setMore] = useState({ key: null, loading: false, errorMessage: null })

  useEffect(() => {
    if (!IS_ACCOUNT_MODE) return undefined
    let isCancelled = false
    const [categoryId] = requestKey.split('|')
    const configProblem = getBackendConfigProblem()
    if (configProblem) {
      Promise.resolve().then(() => !isCancelled && setResult({ key: requestKey, posts: [], hasMore: false, total: null, errorMessage: configProblem }))
      return () => {
        isCancelled = true
      }
    }
    communityRepository
      .listPosts({ categoryId, sortBy, offset: 0, limit: POST_PAGE_SIZE })
      .then(({ posts, hasMore, total }) => !isCancelled && setResult({ key: requestKey, posts, hasMore, total, errorMessage: null }))
      .catch((error) => !isCancelled && setResult({ key: requestKey, posts: [], hasMore: false, total: null, errorMessage: error.message }))
    return () => {
      isCancelled = true
    }
  }, [requestKey, sortBy])

  useEffect(() => {
    if (!IS_ACCOUNT_MODE || !userId) return undefined
    let isCancelled = false
    communityRepository.listLeftoverPhotos().then((items) => !isCancelled && setLeftoverPhotos(items))
    return () => {
      isCancelled = true
    }
  }, [userId, navNotice])

  const handleRetryCleanup = async () => {
    setCleaningUp(true)
    setLeftoverPhotos(await communityRepository.retryPhotoCleanup())
    setCleaningUp(false)
  }

  const isLoading = IS_ACCOUNT_MODE && result.key !== requestKey
  const loadErrorMessage = IS_ACCOUNT_MODE && !isLoading ? result.errorMessage : null

  // "더 보기": 지금 보이는 글 수만큼 건너뛰고 다음 20개를 이어 붙여요. 카테고리 · 정렬이 바뀌면 requestKey가 바뀌어서 처음부터 다시 불러와요.
  const handleLoadMore = async () => {
    if (more.loading || !result.hasMore) return
    const startedKey = requestKey
    const [categoryId] = requestKey.split('|')
    setMore({ key: startedKey, loading: true, errorMessage: null })
    try {
      const page = await communityRepository.listPosts({ categoryId, sortBy, offset: result.posts.length, limit: POST_PAGE_SIZE })
      // 기다리는 동안 카테고리 · 정렬을 바꿨다면 이 결과는 버려요 (다른 목록에 섞이지 않게)
      setResult((prev) => (prev.key === startedKey ? { ...prev, posts: mergePostPages(prev.posts, page.posts), hasMore: page.hasMore, total: page.total ?? prev.total } : prev))
      setMore({ key: startedKey, loading: false, errorMessage: null })
    } catch (error) {
      setMore({ key: startedKey, loading: false, errorMessage: error.message })
    }
  }

  // 선택한 카테고리는 주소(?category=)에만 저장해요. 헤더 메뉴로 들어와도, 탭을 눌러도 같은 값을 봐요.
  const handleSelectCategory = (_, categoryId) => {
    setSearchParams(categoryId === 'all' ? {} : { category: categoryId }, { replace: true })
  }

  let sortedPosts
  if (IS_ACCOUNT_MODE) {
    sortedPosts = result.posts // 서버가 이미 고른 카테고리·정렬대로 줬어요
  } else {
    const filteredPosts =
      selectedCategoryId === 'all'
        ? COMMUNITY_POSTS
        : COMMUNITY_POSTS.filter((post) => post.categoryId === selectedCategoryId)
    sortedPosts = [...filteredPosts].sort((a, b) => {
      if (sortBy === 'latest') return b.createdAt.localeCompare(a.createdAt) || b.id - a.id
      return sortBy === 'heart' ? b.heartCount - a.heartCount : b.commentCount - a.commentCount
    })
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 3, sm: 4.5 }, pb: { xs: 6, sm: 8 } }}>
        <SectionHeading
          variant="sign"
          eyebrow="ADVENTURERS' SQUARE"
          title="모험가 광장"
          flank={{ right: { name: 'knight-camera', width: 118 } }}
          description="부산 빵집에서 있었던 일, 새로 나온 메뉴, 오픈런 후기를 나눠요."
          sx={{ mb: { xs: 2, sm: 2.5 } }}
        />

        {navNotice && (
          <Alert severity="warning" onClose={dismissNavNotice} sx={{ mb: 2 }}>
            {navNotice}
          </Alert>
        )}
        {IS_ACCOUNT_MODE && <LeftoverPhotosNotice items={leftoverPhotos} busy={cleaningUp} onRetry={handleRetryCleanup} sx={{ mb: 2 }} />}

        {IS_ACCOUNT_MODE ? (
          <LocalProfileNotice
            sx={{ mb: 2 }}
            accountChildren={
              <>
                여기 글은 가입한 모험가들이 남긴 <b>실제 글</b>이에요. 글 · 댓글 · 좋아요는 계정에 저장되고 <b>EXP에는 반영되지 않아요</b>.
                글 1개에 사진을 1장 붙일 수 있어요.
              </>
            }
          />
        ) : (
          /* 정직한 안내: 게시판 글은 예시이고, 글쓰기는 계정 모드에서만 돼요 */
          <LocalProfileNotice always sx={{ mb: 2 }}>
            게시판의 글은 모두 <b>예시 데이터</b>예요. 이 브라우저의 임시 프로필로는 글을 쓸 수 없고, 글 상세의 댓글도 이 화면에서만
            보여요(저장되지 않아요). 글쓰기는 이메일 계정 모드에서 쓸 수 있어요.
          </LocalProfileNotice>
        )}

        {IS_ACCOUNT_MODE && ready && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            {/* 보통 크기 나무 버튼: 작은 크기보다 눈에 띄되, 글 목록보다 커지지 않게 글자 · 여백만 줄였어요 */}
            <WoodButton
              component={Link}
              to={profile ? '/community/write' : '/login'}
              sx={{ width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '1rem', sm: '1.05rem' }, px: { xs: 2.5, sm: 3.5 }, py: { xs: 1, sm: 1.1 } }}
            >
              {profile ? '새 글 쓰기' : '로그인하고 글쓰기'}
            </WoodButton>
          </Box>
        )}

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
            {isLoading || loadErrorMessage
              ? ' '
              : IS_ACCOUNT_MODE
                ? `글 ${result.total ?? sortedPosts.length}개${result.hasMore ? ` · ${sortedPosts.length}개 보는 중` : ''}`
                : `글 ${sortedPosts.length}개`}
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

        {isLoading ? (
          <StatusMessage mood="loading" title="글을 불러오고 있어요" description="잠시만 기다려 주세요." sx={{ mt: 3 }} />
        ) : loadErrorMessage ? (
          <StatusMessage
            mood="error"
            title="글을 불러오지 못했어요"
            description={loadErrorMessage}
            actionLabel="다시 시도"
            onAction={() => setRetryCount((count) => count + 1)}
            sx={{ mt: 3 }}
          />
        ) : sortedPosts.length === 0 ? (
          <StatusMessage
            mood="empty"
            title="아직 글이 없어요"
            description={
              selectedCategoryId === 'all' || !isKnownCategory
                ? '첫 글의 주인공이 되어 보세요.'
                : '이 카테고리의 첫 글을 기다리고 있어요.'
            }
            actionLabel={selectedCategoryId === 'all' || !isKnownCategory ? undefined : '전체 글 보기'}
            onAction={selectedCategoryId === 'all' || !isKnownCategory ? undefined : () => handleSelectCategory(null, 'all')}
            sparkles
            sx={{ mt: 2 }}
          >
            {/* 글쓰기는 계정 모드에서만 돼요. 위의 '새 글 쓰기'와 같은 곳으로 이어져요 */}
            {IS_ACCOUNT_MODE && ready && (selectedCategoryId === 'all' || !isKnownCategory) && (
              <WoodButton component={Link} to={profile ? '/community/write' : '/login'} sx={{ mt: 1.5 }}>
                {profile ? '첫 번째 모험 기록 남기기' : '로그인하고 첫 기록 남기기'}
              </WoodButton>
            )}
          </StatusMessage>
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {sortedPosts.map((post) => {
              const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
              return (
                <Box component="li" key={post.id}>
                  {IS_ACCOUNT_MODE ? (
                    <CommunityPostListItem
                      id={post.id}
                      categoryLabel={category?.label}
                      title={post.title}
                      author={post.author}
                      authorLevel={levelFromIndex(post.authorLevelIndex)}
                      content={post.content}
                      heartCount={post.heartCount}
                      commentCount={post.commentCount}
                      createdAt={formatPostDate(post.createdAt)}
                      placeholderEmoji={category?.emoji ?? '🍞'}
                      photoUrl={post.photoUrl}
                    />
                  ) : (
                    <CommunityPostListItem
                      {...post}
                      categoryLabel={category?.label}
                      authorLevel={getAuthorLevel(post.author)}
                      photoBakeryId={getPostPhotoBakeryId(post)}
                    />
                  )}
                </Box>
              )
            })}
          </Box>
        )}

        {/* 계정 모드: 20개씩 "더 보기" (버튼). 불러오기에 실패해도 이미 보이는 글은 그대로 두고 아래에만 안내해요 */}
        {IS_ACCOUNT_MODE && !isLoading && !loadErrorMessage && sortedPosts.length > 0 && (
          <LoadMoreFooter
            hasMore={result.hasMore}
            loading={more.loading}
            errorMessage={more.key === requestKey ? more.errorMessage : null}
            pageSize={POST_PAGE_SIZE}
            onLoadMore={handleLoadMore}
          />
        )}
      </Box>
    </Container>
  )
}

export default Community
