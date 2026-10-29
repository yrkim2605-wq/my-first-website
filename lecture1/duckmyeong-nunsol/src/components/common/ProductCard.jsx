import { Box, Card, IconButton, Typography } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import ImagePlaceholder from './ImagePlaceholder'

const ProductCard = ({ brand, name, price, badge }) => {
  return (
    <Card
      variant="outlined"
      sx={{ position: 'relative', borderRadius: 2, transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }}
    >
      {badge && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
            bgcolor: 'primary.main',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
          }}
        >
          {badge}
        </Box>
      )}
      <IconButton aria-label="찜" size="small" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <FavoriteBorderIcon fontSize="small" />
      </IconButton>
      <ImagePlaceholder label="상품 이미지" sx={{ aspectRatio: '1 / 1' }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
          {brand}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1.5, minHeight: 40 }}>
          {name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 700 }}>
            ₩ {price.toLocaleString()}
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
