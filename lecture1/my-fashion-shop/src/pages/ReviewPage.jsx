import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded'

const REVIEWS = [
  {
    id: 1,
    name: '유리나',
    handle: '@yurina_fit',
    avatar: 'https://picsum.photos/seed/rv1/60/60',
    img: 'https://picsum.photos/seed/rvimg1/400/500',
    height: 165,
    weight: 49,
    size: 'S / 26',
    product: '오버핏 화이트 셔츠',
    brand: 'ZARA',
    price: '29,900',
    rating: 5,
    satisfaction: '완전 만족',
    review: '생각보다 훨씬 핏이 예쁘게 나와요! 165에 49kg인데 S 사이즈 딱 맞아요. 오버핏이라 어깨 약간 내려오는 스타일. 소재도 고급스럽고 여름에 딱!',
    likes: 2140,
    tags: ['여름룩', '오피스룩', '오버핏'],
  },
  {
    id: 2,
    name: '민지스타일',
    handle: '@minjistyle_kr',
    avatar: 'https://picsum.photos/seed/rv2/60/60',
    img: 'https://picsum.photos/seed/rvimg2/400/500',
    height: 162,
    weight: 52,
    size: 'M / 27',
    product: '블랙 와이드 슬랙스',
    brand: 'H&M',
    price: '45,000',
    rating: 4,
    satisfaction: '만족',
    review: '와이드 핏인데 허리는 딱 맞게 나와요. 길이는 키 162에 약간 긴 편인데 굽 신으면 완벽해요. 블랙이라 어떤 상의에도 잘 어울려서 자주 입을 것 같아요 🖤',
    likes: 1893,
    tags: ['블랙코디', '와이드팬츠', '출근룩'],
  },
  {
    id: 3,
    name: '지연패션',
    handle: '@jiyeon_fashion',
    avatar: 'https://picsum.photos/seed/rv3/60/60',
    img: 'https://picsum.photos/seed/rvimg3/400/500',
    height: 168,
    weight: 54,
    size: '250',
    product: '청키 스니커즈',
    brand: 'NEW ERA',
    price: '89,000',
    rating: 5,
    satisfaction: '완전 만족',
    review: '신어보니까 너무 편하고 예뻐요!! 청키한 솔이라 키도 커 보이고 발도 작아 보이는 마법✨ 색깔도 생각보다 훨씬 예쁜 블랙이에요. 강추합니다!',
    likes: 4210,
    tags: ['스니커즈', '청키솔', '캐주얼'],
  },
  {
    id: 4,
    name: '소율STYLE',
    handle: '@soyul_s',
    avatar: 'https://picsum.photos/seed/rv4/60/60',
    img: 'https://picsum.photos/seed/rvimg4/400/500',
    height: 160,
    weight: 47,
    size: 'XS / 25',
    product: '미니 크로스백',
    brand: 'ADER',
    price: '38,000',
    rating: 4,
    satisfaction: '만족',
    review: '가방 크기가 생각보다 작아요. 핸드폰이랑 카드지갑, 립밤 정도 들어가는 미니백. 근데 그 크기가 너무 귀엽고 코디 포인트로 짱이에요💚',
    likes: 987,
    tags: ['미니백', '크로스백', '데일리'],
  },
]

const StarRating = ({ rating }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
    {[1, 2, 3, 4, 5].map((i) =>
      i <= rating ? (
        <StarRoundedIcon key={i} sx={{ color: '#39FF14', fontSize: 16 }} />
      ) : (
        <StarBorderRoundedIcon key={i} sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }} />
      )
    )}
  </Box>
)

const ReviewPage = () => {
  const navigate = useNavigate()
  const [liked, setLiked] = useState({})

  const toggleLike = (id) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <Box sx={{ bgcolor: '#0B0B0B', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky',
          top: 56,
          bgcolor: '#0B0B0B',
          zIndex: 10,
        }}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>
          인플루언서 리뷰
        </Typography>
      </Box>

      <Box sx={{ px: 2, pt: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}>
          실착 사진과 솔직한 사이즈 후기 💚
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {REVIEWS.map((review) => (
            <Box
              key={review.id}
              sx={{
                bgcolor: '#141414',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* 리뷰어 헤더 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, pb: 1.5 }}>
                <Box
                  component="img"
                  src={review.avatar}
                  alt=""
                  sx={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #39FF14' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{review.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#39FF14', fontSize: 12 }}>{review.handle}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <StarRating rating={review.rating} />
                  <Chip
                    label={review.satisfaction}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(57,255,20,0.1)',
                      color: '#39FF14',
                      border: '1px solid rgba(57,255,20,0.2)',
                      fontSize: 10,
                      height: 18,
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Box>

              {/* 실착 사진 */}
              <Box component="img" src={review.img} alt="" sx={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 420 }} />

              {/* 체형 & 사이즈 정보 */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {[
                  { label: '키', value: `${review.height}cm` },
                  { label: '몸무게', value: `${review.weight}kg` },
                  { label: '구매 사이즈', value: review.size },
                ].map((info) => (
                  <Box
                    key={info.label}
                    sx={{
                      flex: 1,
                      bgcolor: '#0B0B0B',
                      borderRadius: 1.5,
                      px: 1,
                      py: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', mb: 0.3 }}>
                      {info.label}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: 'white', fontWeight: 700 }}>{info.value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* 상품 정보 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.2,
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {review.brand}
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{review.product}</Typography>
                </Box>
                <Typography sx={{ color: '#39FF14', fontWeight: 700, fontSize: 15 }}>{review.price}원</Typography>
              </Box>

              {/* 리뷰 텍스트 */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: 13 }}>
                  {review.review}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  {review.tags.map((tag) => (
                    <Typography key={tag} variant="caption" sx={{ color: '#39FF14', fontWeight: 600, fontSize: 11 }}>
                      #{tag}
                    </Typography>
                  ))}
                </Box>
              </Box>

              {/* 좋아요 */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  pb: 1.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => toggleLike(review.id)}
                  sx={{ color: liked[review.id] ? '#FF4D6D' : 'rgba(255,255,255,0.4)', p: 0.5 }}
                >
                  {liked[review.id] ? (
                    <FavoriteRoundedIcon sx={{ fontSize: 20 }} />
                  ) : (
                    <FavoriteBorderRoundedIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {(review.likes + (liked[review.id] ? 1 : 0)).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ height: 24 }} />
    </Box>
  )
}

export default ReviewPage
