import { Box, Card, IconButton, Typography } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import ImagePlaceholder from './ImagePlaceholder'

// image가 없으면 회색 플레이스홀더를 보여줌
const ProductCard = ({ brand, name, price, originalPrice, badge, image }) => {
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
        {badge ? (
          <Box
            sx={{
              bgcolor: 'primary.main',
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
        ) : (
          <span />
        )}
        <IconButton aria-label="찜" size="small">
          <FavoriteBorderIcon fontSize="small" />
        </IconButton>
      </Box>

      {image ? (
        <Box
          component="img"
          src={image}
          alt={name}
          sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <ImagePlaceholder label="상품 이미지" sx={{ aspectRatio: '1 / 1' }} />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2 }}>
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1.5 }}>
          {brand}
        </Typography>
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
        <Typography
          variant="caption"
          sx={{ mt: 'auto', height: '1.4em', lineHeight: 1.4, color: 'text.secondary', textDecoration: 'line-through' }}
        >
          {originalPrice ? `₩ ${originalPrice.toLocaleString()}` : ''}
        </Typography>
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
