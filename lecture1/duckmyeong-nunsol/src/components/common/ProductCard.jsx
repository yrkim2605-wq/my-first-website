import { Box, Card, IconButton, Typography } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import ImagePlaceholder from './ImagePlaceholder'

// 기존 사이트의 태그 종류별 색상 (그 외 태그는 기본 오렌지)
const BADGE_COLORS = {
  히트: '#3A3D42',
  추천: '#F5A623',
  할인: '#7B4BBF',
  재고문의: '#9CA3AF',
}

// image가 없으면 회색 플레이스홀더를 보여줌 / badges는 ['히트', '추천', 'NEW'] 처럼 여러 개 가능
const ProductCard = ({ name, price, originalPrice, discountRate, badges = [], image }) => {
  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        transition: 'box-shadow .2s, border-color .2s',
        '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
      }}
    >
      {/* 배지(왼쪽)와 찜(오른쪽)을 한 줄에 두어 모든 카드에서 같은 높이에 정렬 */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {badges.map((badge) => (
            <Box
              key={badge}
              sx={{
                bgcolor: BADGE_COLORS[badge] ?? 'primary.main',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: 1,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
              }}
            >
              {badge}
            </Box>
          ))}
        </Box>
        <IconButton aria-label="찜" size="small">
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>

      {image ? (
        // 위쪽 여백: 배지와 찜 아이콘이 사진을 가리지 않게
        <Box sx={{ width: '100%', aspectRatio: '1 / 1', bgcolor: '#fff', boxSizing: 'border-box', px: 2, pt: 6, pb: 1 }}>
          <Box
            component="img"
            src={image}
            alt={name}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
      ) : (
        <ImagePlaceholder label="상품 이미지" sx={{ aspectRatio: '1 / 1' }} />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2 }}>
        {/* 상품명은 최대 2줄, 항상 2줄 높이를 차지해서 카드 높이가 같아짐 */}
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            lineHeight: 1.5,
            height: '3em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {name}
        </Typography>
        {/* 정가(할인 상품만): 없는 카드도 같은 높이를 차지해서 가격 위치가 통일됨 */}
        <Box sx={{ mt: 'auto', height: '1.4em', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {originalPrice && (
            <Typography
              variant="caption"
              sx={{ lineHeight: 1.4, color: 'text.secondary', textDecoration: 'line-through' }}
            >
              ₩ {originalPrice.toLocaleString()}
            </Typography>
          )}
          {discountRate && (
            <Typography variant="caption" sx={{ lineHeight: 1.4, color: '#7B4BBF', fontWeight: 700 }}>
              {discountRate}% 할인
            </Typography>
          )}
        </Box>
        {/* 가격과 장바구니 버튼은 카드 맨 아래에 고정 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 700 }}>
            {price === null ? '가격문의' : `₩ ${price.toLocaleString()}`}
          </Typography>
          <IconButton
            aria-label="장바구니 담기"
            size="small"
            sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <ShoppingCartOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  )
}

export default ProductCard
