import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const MENU_ITEMS = [
  { label: '주문 내역', icon: '📦' },
  { label: '리뷰 관리', icon: '⭐' },
  { label: '팔로우 목록', icon: '👥' },
  { label: '팔로워 목록', icon: '❤️' },
  { label: '저장한 코디', icon: '🔖' },
]

const MyPage = () => {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState(0)
  const [myPosts, setMyPosts] = useState([])
  const [likedPosts, setLikedPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchMyData()
  }, [profile])

  const fetchMyData = async () => {
    setLoading(true)

    const [postsRes, likesRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, post_images(storage_path, order_index)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('likes')
        .select('post_id, posts(id, post_images(storage_path, order_index))')
        .eq('user_id', profile.id),
    ])

    setMyPosts(postsRes.data || [])
    setLikedPosts((likesRes.data || []).map((l) => l.posts).filter(Boolean))
    setLoading(false)
  }

  const getThumbUrl = (post) => {
    const images = post?.post_images || []
    const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
    if (sorted.length > 0) {
      const { data } = supabase.storage.from('post-images').getPublicUrl(sorted[0].storage_path)
      return data.publicUrl
    }
    return `https://picsum.photos/seed/${post?.id || 'default'}/200/250`
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const postsByTab = [myPosts, likedPosts, []]

  return (
    <Box sx={{ bgcolor: '#0B0B0B', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', fontSize: 18 }}>
          마이페이지
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <SettingsOutlinedIcon />
          </IconButton>
          <IconButton onClick={handleSignOut} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <LogoutRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 프로필 */}
      <Box sx={{ px: 2, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
          <Box sx={{ position: 'relative' }}>
            {profile?.avatar_url ? (
              <Box
                component="img"
                src={profile.avatar_url}
                alt=""
                sx={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #39FF14' }}
              />
            ) : (
              <Box
                sx={{
                  width: 80, height: 80, borderRadius: '50%',
                  bgcolor: '#1A1A1A', border: '2.5px solid #39FF14',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: '#39FF14', fontWeight: 800, fontSize: 28 }}>
                  {(profile?.name || '?')[0].toUpperCase()}
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              sx={{
                position: 'absolute', bottom: -4, right: -4,
                bgcolor: '#39FF14', color: '#0B0B0B', width: 24, height: 24,
                '&:hover': { bgcolor: '#2ECC10' },
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 17 }}>
              {profile?.name || '사용자'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#39FF14', fontWeight: 600 }}>
              @{profile?.username || profile?.name || 'user'}
            </Typography>
            {profile?.bio && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.8, fontSize: 13 }}>
                {profile.bio}
              </Typography>
            )}
          </Box>
        </Box>

        {/* 통계 */}
        <Box sx={{ display: 'flex', mt: 2.5, bgcolor: '#141414', borderRadius: 2.5, overflow: 'hidden' }}>
          {[
            { label: '게시물', value: myPosts.length },
            { label: '팔로잉', value: profile?.following_count || 0 },
            { label: '팔로워', value: profile?.followers_count || 0 },
          ].map((stat, idx) => (
            <Box
              key={stat.label}
              sx={{
                flex: 1, textAlign: 'center', py: 1.8,
                borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 18 }}>
                {stat.value >= 1000 ? (stat.value / 1000).toFixed(1) + 'k' : stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Button
          fullWidth
          variant="outlined"
          sx={{
            mt: 2, borderColor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 2, fontWeight: 600,
            '&:hover': { borderColor: '#39FF14', color: '#39FF14', bgcolor: 'rgba(57,255,20,0.05)' },
          }}
        >
          프로필 수정
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

      {/* 게시물 탭 */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          '& .MuiTab-root': { color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13 },
          '& .Mui-selected': { color: '#39FF14' },
          '& .MuiTabs-indicator': { bgcolor: '#39FF14' },
        }}
      >
        <Tab label="게시물" />
        <Tab label="좋아요" />
        <Tab label="저장됨" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}>
          <CircularProgress sx={{ color: '#39FF14' }} />
        </Box>
      ) : (
        <Box sx={{ p: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0.5 }}>
            {postsByTab[tab].map((post, idx) => (
              <Box
                key={post?.id || idx}
                onClick={() => navigate('/posts/' + post?.id)}
                sx={{ aspectRatio: '3/4', overflow: 'hidden', cursor: 'pointer', bgcolor: '#1A1A1A' }}
              >
                <Box
                  component="img"
                  src={getThumbUrl(post)}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)' } }}
                />
              </Box>
            ))}
          </Box>
          {postsByTab[tab].length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>게시물이 없습니다</Typography>
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mt: 1 }} />

      {/* 메뉴 리스트 */}
      <Box sx={{ py: 1 }}>
        {MENU_ITEMS.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex', alignItems: 'center', px: 2, py: 1.8, gap: 2, cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
            }}
          >
            <Typography sx={{ fontSize: 20 }}>{item.icon}</Typography>
            <Typography sx={{ color: 'white', fontWeight: 500, fontSize: 15, flex: 1 }}>{item.label}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default MyPage
