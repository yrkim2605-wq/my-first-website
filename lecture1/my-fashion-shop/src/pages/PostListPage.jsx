import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import { supabase } from '../lib/supabase'

const FILTERS = ['전체', '코디', '팔로우', 'AI 추천']

const PostListPage = () => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('전체')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, title, content, category, tags, likes_count, view_count, created_at,
        profiles ( id, username, name, avatar_url ),
        post_images ( storage_path, order_index )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (!error) setPosts(data || [])
    setLoading(false)
  }

  const getImageUrl = (post) => {
    const images = post.post_images || []
    const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
    if (sorted.length > 0) {
      const { data } = supabase.storage.from('post-images').getPublicUrl(sorted[0].storage_path)
      return data.publicUrl
    }
    return `https://picsum.photos/seed/${post.id}/200/280`
  }

  const leftPosts = posts.filter((_, i) => i % 2 === 0)
  const rightPosts = posts.filter((_, i) => i % 2 !== 0)

  return (
    <Box sx={{ bgcolor: '#0B0B0B', minHeight: '100vh' }}>
      {/* 필터 탭 */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', gap: 1, overflowX: 'auto' }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            onClick={() => setActiveFilter(f)}
            sx={{
              flexShrink: 0,
              bgcolor: activeFilter === f ? '#39FF14' : '#1A1A1A',
              color: activeFilter === f ? '#0B0B0B' : 'rgba(255,255,255,0.7)',
              fontWeight: activeFilter === f ? 700 : 400,
              border: activeFilter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </Box>

      {/* 로딩 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
          <CircularProgress sx={{ color: '#39FF14' }} />
        </Box>
      )}

      {/* 빈 상태 */}
      {!loading && posts.length === 0 && (
        <Box sx={{ textAlign: 'center', pt: 10 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>
            아직 게시물이 없어요
          </Typography>
          <Typography
            onClick={() => navigate('/create')}
            sx={{ color: '#39FF14', fontWeight: 700, mt: 1, cursor: 'pointer' }}
          >
            첫 코디를 올려보세요 ✨
          </Typography>
        </Box>
      )}

      {/* Pinterest 마소너리 그리드 */}
      {!loading && posts.length > 0 && (
        <Box sx={{ px: 1.5, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          {[leftPosts, rightPosts].map((colPosts, colIdx) => (
            <Box key={colIdx} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {colPosts.map((post) => (
                <Box
                  key={post.id}
                  onClick={() => navigate('/posts/' + post.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box sx={{ borderRadius: 2.5, overflow: 'hidden', bgcolor: '#1A1A1A', position: 'relative' }}>
                    <Box
                      component="img"
                      src={getImageUrl(post)}
                      alt=""
                      sx={{ width: '100%', display: 'block', objectFit: 'cover' }}
                    />
                    {post.category && (
                      <Box
                        sx={{
                          position: 'absolute', top: 8, left: 8,
                          bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                          borderRadius: 1, px: 0.8, py: 0.3,
                        }}
                      >
                        <Typography sx={{ fontSize: 10, color: '#39FF14', fontWeight: 700 }}>
                          #{post.category}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ px: 0.5, pt: 0.8, pb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'white', fontWeight: 600, display: 'block', fontSize: 13, lineHeight: 1.4 }}
                    >
                      {post.title || post.content?.slice(0, 20) || '코디'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      {post.profiles?.avatar_url ? (
                        <Box
                          component="img"
                          src={post.profiles.avatar_url}
                          alt=""
                          sx={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#39FF14' }} />
                      )}
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                        @{post.profiles?.username || post.profiles?.name || '익명'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <FavoriteBorderRoundedIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          {post.likes_count >= 1000
                            ? (post.likes_count / 1000).toFixed(1) + 'k'
                            : post.likes_count || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                          {post.view_count || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default PostListPage
