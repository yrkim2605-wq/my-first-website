import { Box, Button, Card, IconButton, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import { useNavigate } from 'react-router-dom'
import useShop from '../../hooks/useShop'
import { splitProductName } from '../../utils/productName'
import ImagePlaceholder from './ImagePlaceholder'

// 기존 사이트의 태그 종류별 색상 (그 외 태그는 기본 오렌지)
const BADGE_COLORS = {
  히트: '#3A3D42',
  추천: '#F5A623',
  할인: '#7B4BBF',
  재고문의: '#9CA3AF',
}

// image가 없으면 회색 플레이스홀더를 보여줌 / badges는 ['히트', '추천', 'NEW'] 처럼 여러 개 가능
const ProductCard = ({ id, name, brand, price, originalPrice, discountRate, badges = [], image }) => {
  const { wishIds, toggleWish, addToCart, addToQuote, notify } = useShop()
  const navigate = useNavigate()
  const isWished = wishIds.includes(id)
  const isQuoteOnly = price === null
  const product = { id, name, brand, price, image }
  // 원본 상품명의 " ," 때문에 줄이 쉼표로 시작하지 않도록 화면에서만 붙여서 표시 (데이터는 그대로)
  const displayName = name.replace(/ ,/g, '\u00A0,')
  const nameSegments = splitProductName(displayName)
  const highlights = nameSegments.filter((segment) => segment.isHighlight)

  // 가격문의 상품: 견적 목록에 담고, 바로 견적서로 갈 수 있게 알림에 버튼을 붙임
  const handleAddToQuote = () => {
    addToQuote(product)
    notify('견적 목록에 담았어요', 'success', { label: '견적서 보기', onClick: () => navigate('/quote') })
  }

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
                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                px: { xs: 0.625, sm: 1 },
                py: 0.5,
                borderRadius: 0.5,
              }}
            >
              {badge}
            </Box>
          ))}
        </Box>
        <IconButton
          aria-label={isWished ? `${name} 찜 해제` : `${name} 찜하기`}
          aria-pressed={isWished}
          size="small"
          onClick={() => toggleWish(product)}
        >
          {isWished ? <FavoriteIcon fontSize="small" color="primary" /> : <FavoriteBorderIcon fontSize="small" />}
        </IconButton>
      </Box>

      {image ? (
        // 위쪽 여백: 배지와 찜 아이콘이 사진을 가리지 않게
        <Box sx={{ width: '100%', aspectRatio: '1 / 1', bgcolor: '#fff', boxSizing: 'border-box', px: 2, pt: 6, pb: 1 }}>
          <Box
            component="img"
            src={image}
            loading="lazy"
            decoding="async"
            alt={name}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
      ) : (
        <ImagePlaceholder label="상품 이미지" sx={{ aspectRatio: '1 / 1' }} />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: { xs: 1.5, sm: 2 } }}>
        {/* 브랜드(작게) + 상품명(최대 2줄). 항상 2줄 높이를 차지해서 가격·버튼 위치가 모든 카드에서 같음.
            산업용 공구는 모델명·규격이 중요해서 굵게 강조하고, 길어서 잘려도 title로 전체 이름을 볼 수 있음 */}
        {brand && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.4, mb: 0.25 }}>
            {brand}
          </Typography>
        )}
        <Typography
          component="h3"
          title={name}
          sx={{
            mb: 0.75,
            fontSize: { xs: '0.9375rem', lg: '1.0625rem' },
            fontWeight: 500,
            lineHeight: 1.45,
            height: '2.9em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'keep-all',
          }}
        >
          {nameSegments.map((segment, index) =>
            segment.isHighlight ? (
              <Box
                key={index}
                component="span"
                sx={{ fontWeight: 700, color: '#111', bgcolor: '#F1F2F4', px: 0.5, borderRadius: 0.5, boxDecorationBreak: 'clone' }}
              >
                {segment.text}
              </Box>
            ) : (
              segment.text
            ),
          )}
        </Typography>
        {/* 좁은 화면(2열)에서는 이름이 2줄에서 잘릴 수 있어서 모델명·규격을 한 줄로 따로 보여줌 (스크린리더는 이름에서 읽으므로 숨김) */}
        <Box
          aria-hidden
          sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5, height: 22, mb: 0.75, overflow: 'hidden' }}
        >
          {highlights.map((segment) => (
            <Box
              key={segment.text}
              component="span"
              sx={{
                maxWidth: '100%',
                px: 0.75,
                bgcolor: '#F1F2F4',
                borderRadius: 0.5,
                color: '#111',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: '20px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {segment.text}
            </Box>
          ))}
        </Box>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: { xs: '0.9375rem', lg: '1.0625rem' }, whiteSpace: 'nowrap' }}>
            {price === null ? '가격문의' : `₩ ${price.toLocaleString()}`}
          </Typography>
          {isQuoteOnly ? (
            // 가격문의 상품은 장바구니 대신 견적 요청
            <Button variant="contained" size="small" onClick={handleAddToQuote} sx={{ py: 0.25, px: 1.5 }}>
              견적 요청
            </Button>
          ) : (
            <IconButton
              aria-label={`${name} 장바구니 담기`}
              size="small"
              onClick={() => addToCart(product)}
              sx={{ bgcolor: 'primary.main', color: '#fff', borderRadius: 1, '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <ShoppingCartOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Card>
  )
}

export default ProductCard
