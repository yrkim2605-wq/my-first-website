import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { supabase } from '../lib/supabaseClient'
import PostCard from '../components/common/PostCard'

const PAGE_SIZE = 10

const PostListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const [posts, setPosts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchPosts = async () => {
      setLoading(true)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, count, error } = await supabase
        .from('posts')
        .select(
          'id,title,created_at,profiles(name),comments(count),likes(count),post_images(storage_path)',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!active) return
      if (!error && data) {
        setPosts(
          data.map((post) => ({
            ...post,
            commentCount: post.comments?.[0]?.count ?? 0,
            likeCount: post.likes?.[0]?.count ?? 0,
            thumbnail: post.post_images?.[0]
              ? supabase.storage.from('post-photos').getPublicUrl(post.post_images[0].storage_path).data.publicUrl
              : null,
          })),
        )
        setTotalCount(count ?? 0)
      }
      setLoading(false)
    }
    fetchPosts()
    return () => {
      active = false
    }
  }, [page])

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        🥐 게시물 목록
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          아직 작성된 게시물이 없습니다.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Stack>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            page={page}
            count={pageCount}
            color="primary"
            onChange={(_e, value) => setSearchParams({ page: String(value) })}
          />
        </Box>
      )}
    </Container>
  )
}

export default PostListPage
