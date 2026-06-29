import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import SwipeCarousel from '../components/common/SwipeCarousel'

const CATEGORIES = ['아우터', '상의', '하의', '원피스', '신발', '가방', '소품']

const BANNERS = [
  { label: '🔥 오늘의 핫딜', sub: '최대 70% OFF', color: '#1A0A0A', emoji: '🔥' },
  { label: '🎫 신규 쿠폰 지급', sub: '첫 구매 20% 할인', color: '#0F1A0F', emoji: '🎫' },
  { label: '🌊 여름 시즌 이벤트', sub: '여름 특가 진행중', color: '#0A0A1A', emoji: '🌊' },
  { label: '✨ 인기 쇼핑몰 TOP', sub: 'ZARA · H&M · ADER 입점', color: '#1A1A0A', emoji: '✨' },
]

const AI_COORDS = [
  { id: 1, img: 'https://picsum.photos/seed/coord1/200/280', title: '시크 캐주얼', like: 1234 },
  { id: 2, img: 'https://picsum.photos/seed/coord2/200/280', title: '데일리 모노톤', like: 892 },
  { id: 3, img: 'https://picsum.photos/seed/coord3/200/280', title: '스트릿 무드', like: 2100 },
  { id: 4, img: 'https://picsum.photos/seed/coord4/200/280', title: '오피스 룩', like: 743 },
]

const TREND_COORDS = [
  { id: 1, img: 'https://picsum.photos/seed/trend1/180/240', user: '@yuri_fits', likes: 3421, tag: 'OOTD' },
  { id: 2, img: 'https://picsum.photos/seed/trend2/180/300', user: '@minjistyle', likes: 1892, tag: '여름룩' },
  { id: 3, img: 'https://picsum.photos/seed/trend3/180/260', user: '@seoulfashion', likes: 4102, tag: '데일리' },
  { id: 4, img: 'https://picsum.photos/seed/trend4/180/220', user: '@hipfits_kr', likes: 987, tag: '모노톤' },
]

const BEST_PRODUCTS = [
  { id: 1, img: 'https://picsum.photos/seed/prod1/160/200', name: '오버핏 화이트 셔츠', price: '29,900', brand: 'ZARA' },
  { id: 2, img: 'https://picsum.photos/seed/prod2/160/200', name: '블랙 와이드 슬랙스', price: '45,000', brand: 'H&M' },
  { id: 3, img: 'https://picsum.photos/seed/prod3/160/200', name: '미니 크로스백', price: '38,000', brand: 'ADER' },
  { id: 4, img: 'https://picsum.photos/seed/prod4/160/200', name: '청키 스니커즈', price: '89,000', brand: 'NEW ERA' },
]

const SectionTitle = ({ children, sub }) => (
  <Box sx={{ px: 2, mb: 1.5, display: 'flex', alignItems: 'baseline', gap: 1 }}>
    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
      {children}
    </Typography>
    {sub && (
      <Typography variant="caption" sx={{ color: '#39FF14', fontWeight: 600 }}>
        {sub}
      </Typography>
    )}
  </Box>
)

const HomePage = () => {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('아우터')

  return (
    <Box sx={{ bgcolor: '#0B0B0B', pb: 2 }}>

      {/* ── 메인 배너 (스와이프 카루셀) ── */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <SwipeCarousel
            items={BANNERS}
            height={150}
            renderItem={(banner) => (
              <Box
                sx={{
                  height: 150,
                  bgcolor: banner.color,
                  border: '1px solid rgba(57,255,20,0.15)',
                  borderRadius: 3,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute', top: 16, right: 16,
                    width: 56, height: 56, borderRadius: '50%',
                    bgcolor: 'rgba(57,255,20,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}
                >
                  {banner.emoji}
                </Box>
                <Typography variant="h6" sx={{ color: '#39FF14', fontWeight: 800, mb: 0.3, fontSize: 17 }}>
                  {banner.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  {banner.sub}
                </Typography>
              </Box>
            )}
          />
        </Box>
      </Box>

      {/* ── 카테고리 ── */}
      <Box
        sx={{
          px: 2, py: 1.5, display: 'flex', gap: 1,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setActiveCategory(cat)}
            sx={{
              flexShrink: 0,
              bgcolor: activeCategory === cat ? '#39FF14' : '#1A1A1A',
              color: activeCategory === cat ? '#0B0B0B' : 'rgba(255,255,255,0.7)',
              fontWeight: activeCategory === cat ? 700 : 400,
              border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </Box>

      {/* ── AI 추천 코디 (스냅 가로 스크롤) ── */}
      <Box sx={{ mt: 2 }}>
        <SectionTitle sub="AI PICK">AI 추천 코디</SectionTitle>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            pl: 2,
            pr: 1,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {AI_COORDS.map((coord) => (
            <Box
              key={coord.id}
              onClick={() => navigate('/posts/1')}
              sx={{ flexShrink: 0, cursor: 'pointer', width: 140, scrollSnapAlign: 'start' }}
            >
              <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#1A1A1A', height: 186, position: 'relative' }}>
                <Box
                  component="img"
                  src={coord.img}
                  alt={coord.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute', top: 8, right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1, px: 0.8, py: 0.3,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: '#39FF14', fontWeight: 700 }}>AI</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block', mt: 0.8 }}>
                {coord.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                ♥ {coord.like.toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── 요즘 인기 코디 (2열 그리드) ── */}
      <Box sx={{ mt: 3 }}>
        <SectionTitle sub="TRENDING">요즘 인기 코디</SectionTitle>
        <Box sx={{ px: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {TREND_COORDS.map((coord) => (
            <Box
              key={coord.id}
              onClick={() => navigate('/posts/' + coord.id)}
              sx={{ cursor: 'pointer' }}
            >
              <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#1A1A1A', position: 'relative' }}>
                <Box
                  component="img"
                  src={coord.img}
                  alt=""
                  sx={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                />
                <Box
                  sx={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    p: 1,
                  }}
                >
                  <Chip
                    label={`#${coord.tag}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(57,255,20,0.2)', color: '#39FF14', fontSize: 10, height: 20 }}
                  />
                </Box>
              </Box>
              <Box sx={{ mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                  {coord.user}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                  ♥ {coord.likes.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── 실시간 인기 상품 (스냅 가로 스크롤) ── */}
      <Box sx={{ mt: 3 }}>
        <SectionTitle sub="HOT NOW">실시간 인기 상품</SectionTitle>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            pl: 2,
            pr: 1,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {BEST_PRODUCTS.map((product, idx) => (
            <Box key={product.id} sx={{ flexShrink: 0, width: 150, cursor: 'pointer', scrollSnapAlign: 'start' }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#1A1A1A', height: 190 }}>
                  <Box
                    component="img"
                    src={product.img}
                    alt={product.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box
                  sx={{
                    position: 'absolute', top: 8, left: 8,
                    width: 24, height: 24, borderRadius: '50%',
                    bgcolor: idx < 3 ? '#39FF14' : '#333',
                    color: idx < 3 ? '#0B0B0B' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12,
                  }}
                >
                  {idx + 1}
                </Box>
              </Box>
              <Box sx={{ mt: 0.8 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                  {product.brand}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'white', display: 'block', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}
                >
                  {product.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#39FF14', fontWeight: 700, fontSize: 13 }}>
                  {product.price}원
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── 인플루언서 리뷰 배너 ── */}
      <Box sx={{ px: 2, mt: 3 }}>
        <Box
          onClick={() => navigate('/reviews')}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(57,255,20,0.2)',
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(57,255,20,0.05)' },
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: '#39FF14', fontWeight: 700, mb: 0.5 }}>
              인플루언서 리뷰 보러가기
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              실착 사진 · 사이즈 후기 · 만족도
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {[1, 2, 3].map((i) => (
              <StarRoundedIcon key={i} sx={{ color: '#39FF14', fontSize: 16 }} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default HomePage
