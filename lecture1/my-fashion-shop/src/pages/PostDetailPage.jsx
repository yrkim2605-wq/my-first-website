import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded'
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SwipeCarousel from '../components/common/SwipeCarousel'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const MOCK_PRODUCTS = [
  { name: '오버핏 화이트 셔츠', brand: 'ZARA', price: '29,900', img: 'https://picsum.photos/seed/item1/80/100' },
  { name: '블랙 와이드 슬랙스', brand: 'H&M', price: '45,000', img: 'https://picsum.photos/seed/item2/80/100' },
  { name: '청키 스니커즈', brand: 'NEW ERA', price: '89,000', img: 'https://picsum.photos/seed/item3/80/100' },
]

const PostDetailPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [id])

  const fetchPost = async () => {
    setLoading(true)

    const [postRes, commentsRes, productsRes, likesRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(id, username, name, avatar_url)')
        .eq('id', id)
        .single(),
      supabase
        .from('comments')
        .select('*, profiles(username, name, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('product_tags')
        .select('*')
        .eq('post_id', id),
      supabase
        .from('likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user?.id),
    ])

    if (postRes.data) {
      setPost(postRes.data)
      setLikeCount(postRes.data.likes_count || 0)

      // 이미지 불러오기
      const { data: imgs } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', id)
        .order('order_index')

      if (imgs && imgs.length > 0) {
        const urls = imgs.map((img) => {
          const { data } = supabase.storage.from('post-images').getPublicUrl(img.storage_path)
          return data.publicUrl
        })
        setImages(urls)
      } else {
        // 목업 이미지 (실제 이미지 없을 때)
        setImages([
          `https://picsum.photos/seed/detail${id}a/430/560`,
          `https://picsum.photos/seed/detail${id}b/430/560`,
          `https://picsum.photos/seed/detail${id}c/430/560`,
        ])
      }
    }

    setComments(commentsRes.data || [])
    setProducts(productsRes.data?.length > 0 ? productsRes.data : MOCK_PRODUCTS)
    setLiked((likesRes.data?.length || 0) > 0)
    setLoading(false)
  }

  const handleLike = async () => {
    if (!user) return
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((prev) => prev + (newLiked ? 1 : -1))

    if (newLiked) {
      await supabase.from('likes').insert({ post_id: id, user_id: user.id })
    } else {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id)
    }
  }

  const handleComment = async () => {
    if (!comment.trim() || !user) return
    setPosting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: user.id, content: comment.trim() })
      .select('*, profiles(username, name, avatar_url)')
      .single()

    if (data) {
      setComments([data, ...comments])
      setComment('')
    }
    setPosting(false)
  }

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return `${Math.floor(diff / 86400)}일 전`
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', bgcolor: '#0B0B0B' }}>
        <CircularProgress sx={{ color: '#39FF14' }} />
      </Box>
    )
  }

  const author = post?.profiles

  return (
    <Box sx={{ bgcolor: '#0B0B0B', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', px: 1, py: 0.5,
          position: 'sticky', top: 56, bgcolor: '#0B0B0B', zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>
          코디 상세
        </Typography>
        <IconButton onClick={() => setSaved(!saved)} sx={{ color: saved ? '#39FF14' : 'white' }}>
          {saved ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
        </IconButton>
        <IconButton sx={{ color: 'white' }}>
          <ShareRoundedIcon />
        </IconButton>
      </Box>

      {/* ── 코디 사진 스와이프 카루셀 ── */}
      <SwipeCarousel
        items={images}
        showDots={true}
        renderItem={(imgUrl) => (
          <Box
            component="img"
            src={imgUrl}
            alt=""
            sx={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }}
          />
        )}
      />

      {/* 좋아요 / 반응 */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={handleLike} sx={{ color: liked ? '#FF4D6D' : 'rgba(255,255,255,0.6)', p: 0.5 }}>
            {liked
              ? <FavoriteRoundedIcon sx={{ fontSize: 26 }} />
              : <FavoriteBorderRoundedIcon sx={{ fontSize: 26 }} />
            }
          </IconButton>
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
            {likeCount.toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          💬 {comments.length} · 👁 {post?.view_count || 0}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label="AI 유사 추천"
            size="small"
            onClick={handleLike}
            sx={{
              bgcolor: liked ? 'rgba(57,255,20,0.15)' : '#1A1A1A',
              color: liked ? '#39FF14' : 'rgba(255,255,255,0.5)',
              border: '1px solid',
              borderColor: liked ? 'rgba(57,255,20,0.4)' : 'rgba(255,255,255,0.1)',
              fontSize: 11, fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      {/* 작성자 정보 */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          {author?.avatar_url ? (
            <Box
              component="img"
              src={author.avatar_url}
              alt=""
              sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #39FF14' }}
            />
          ) : (
            <Box
              sx={{
                width: 42, height: 42, borderRadius: '50%',
                bgcolor: '#1A1A1A', border: '2px solid #39FF14',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#39FF14', fontWeight: 800 }}>
                {(author?.name || '?')[0]}
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
              @{author?.username || author?.name || '익명'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {post?.created_at ? timeAgo(post.created_at) : ''}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#39FF14', color: '#39FF14', borderRadius: 5,
              fontWeight: 700, fontSize: 12, px: 2,
              '&:hover': { bgcolor: 'rgba(57,255,20,0.1)' },
            }}
          >
            팔로우
          </Button>
        </Box>

        {post?.title && (
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 15, mb: 0.5 }}>
            {post.title}
          </Typography>
        )}
        {post?.content && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            {post.content}
          </Typography>
        )}
        {post?.tags?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Typography key={tag} variant="caption" sx={{ color: '#39FF14', fontWeight: 600 }}>
                #{tag}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* 착용 상품 */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 1.5 }}>
          착용 상품
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {products.map((product) => (
            <Box
              key={product.id || product.name}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#141414', borderRadius: 2, p: 1.5 }}
            >
              <Box
                component="img"
                src={product.img || `https://picsum.photos/seed/${product.id}/80/100`}
                alt=""
                sx={{ width: 56, height: 70, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {product.brand}
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
                  {product.product_name || product.name}
                </Typography>
                <Typography sx={{ color: '#39FF14', fontWeight: 700, fontSize: 14, mt: 0.3 }}>
                  {product.price ? `${Number(product.price).toLocaleString()}원` : '가격 미정'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#39FF14', color: '#0B0B0B', fontWeight: 700,
                  fontSize: 12, borderRadius: 2, px: 1.5, py: 0.8, flexShrink: 0,
                  '&:hover': { bgcolor: '#2ECC10' },
                }}
              >
                구매
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* 댓글 */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 1.5 }}>
          댓글 {comments.length}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{ display: 'flex', gap: 1.5 }}>
              <Box
                sx={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  bgcolor: '#1A1A1A', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {c.profiles?.avatar_url
                  ? <Box component="img" src={c.profiles.avatar_url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Typography sx={{ color: '#39FF14', fontWeight: 800, fontSize: 14 }}>{(c.profiles?.name || '?')[0]}</Typography>
                }
              </Box>
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
                    @{c.profiles?.username || c.profiles?.name || '익명'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    {timeAgo(c.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  {c.content}
                </Typography>
              </Box>
            </Box>
          ))}
          {comments.length === 0 && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', py: 2, display: 'block' }}>
              첫 댓글을 남겨보세요!
            </Typography>
          )}
        </Box>

        {/* 댓글 입력 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="댓글을 입력하세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            InputProps={{
              sx: {
                bgcolor: '#1A1A1A', color: 'white', borderRadius: 3,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#39FF14' },
              },
            }}
          />
          <IconButton
            onClick={handleComment}
            disabled={posting}
            sx={{
              bgcolor: comment ? '#39FF14' : '#1A1A1A',
              color: comment ? '#0B0B0B' : 'rgba(255,255,255,0.3)',
              '&:hover': { bgcolor: comment ? '#2ECC10' : '#252525' },
            }}
          >
            {posting ? <CircularProgress size={18} sx={{ color: '#0B0B0B' }} /> : <SendRoundedIcon />}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ height: 24 }} />
    </Box>
  )
}

export default PostDetailPage
