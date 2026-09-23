import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import StarRating from '../components/common/StarRating'
import LikeButton from '../components/common/LikeButton'
import CommentSection from '../components/common/CommentSection'

const formatDate = (iso) => new Date(iso).toLocaleString('ko-KR')

const PostDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [myRating, setMyRating] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPost = useCallback(async () => {
    setLoading(true)

    const [{ data: postData }, { data: imageRows }, { data: commentRows }, { data: likeRows }, { data: ratingRows }] =
      await Promise.all([
        supabase.from('posts').select('*,profiles(name)').eq('id', id).single(),
        supabase.from('post_images').select('storage_path').eq('post_id', id),
        supabase.from('comments').select('*,profiles(name)').eq('post_id', id).order('created_at'),
        supabase.from('likes').select('user_id').eq('post_id', id),
        supabase.from('ratings').select('user_id,score').eq('post_id', id),
      ])

    setPost(postData ?? null)
    setImages(
      (imageRows ?? []).map((row) => supabase.storage.from('post-photos').getPublicUrl(row.storage_path).data.publicUrl),
    )
    setComments(commentRows ?? [])
    setLikeCount(likeRows?.length ?? 0)
    setLiked(Boolean(user && likeRows?.some((row) => row.user_id === user.id)))

    const scores = ratingRows ?? []
    setRatingCount(scores.length)
    setAvgRating(scores.length ? scores.reduce((sum, row) => sum + row.score, 0) / scores.length : 0)
    setMyRating(scores.find((row) => row.user_id === user?.id)?.score ?? 0)

    setLoading(false)
  }, [id, user])

  useEffect(() => {
    supabase.rpc('increment_view_count', { post_id: Number(id) }).then()
  }, [id])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  const handleToggleLike = async () => {
    if (!user) return navigate('/login')
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id })
    }
    loadPost()
  }

  const handleRate = async (score) => {
    if (!user) return navigate('/login')
    await supabase.from('ratings').upsert({ post_id: id, user_id: user.id, score })
    loadPost()
  }

  const handleAddComment = async (content) => {
    if (!user) return navigate('/login')
    await supabase.from('comments').insert({ post_id: id, user_id: user.id, content })
    loadPost()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!post) {
    return (
      <Container maxWidth="sm">
        <Typography align="center" sx={{ py: 8 }}>
          게시물을 찾을 수 없습니다.
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: 4 }}>
        <Link component={RouterLink} to="/posts" underline="hover" color="text.secondary">
          ← 목록으로
        </Link>

        <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>
          {post.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, color: 'text.secondary' }}>
          <Typography variant="body2">{post.profiles?.name ?? '익명'}</Typography>
          <Typography variant="body2">{formatDate(post.created_at)}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VisibilityIcon fontSize="small" />
            <Typography variant="body2">{post.view_count}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <StarRating value={avgRating} count={ratingCount} readOnly />
        </Box>

        {images.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
            {images.map((src) => (
              <Box
                key={src}
                component="img"
                src={src}
                alt=""
                sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
              />
            ))}
          </Box>
        )}

        <Typography variant="body1" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
          <LikeButton liked={liked} count={likeCount} onToggle={handleToggleLike} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              내 별점
            </Typography>
            <StarRating value={myRating} onChange={handleRate} />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <CommentSection comments={comments} onAdd={handleAddComment} />
      </Paper>
    </Container>
  )
}

export default PostDetailPage
