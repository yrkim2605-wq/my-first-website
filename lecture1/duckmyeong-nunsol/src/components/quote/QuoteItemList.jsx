import { Box, Button, IconButton, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined'
import useShop from '../../hooks/useShop'
import QuantityStepper from '../common/QuantityStepper'

const ROW_BORDER = '#F0F1F3'

// 데스크톱: 한 줄에 [제품 | 수량 | 금액 | 삭제] / 모바일: 제품 위, 수량·금액 아래
const ROW_COLUMNS = { xs: '1fr auto', md: '1fr auto 120px 36px' }
const ROW_AREAS = { xs: '"item remove" "qty total"', md: '"item qty total remove"' }

const formatPrice = (price) => (price === null ? '가격문의' : `₩ ${price.toLocaleString()}`)

// 담은 제품 목록: 수량 조절 · 삭제
const QuoteItemList = () => {
  const { quoteItems, changeQuoteQuantity, removeFromQuote, clearQuote } = useShop()

  if (quoteItems.length === 0) {
    return (
      <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary', bgcolor: '#F9FAFB', borderRadius: 1 }}>
        <PlaylistAddOutlinedIcon sx={{ fontSize: 36, opacity: 0.45 }} />
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          아직 담은 제품이 없어요
        </Typography>
        <Typography variant="caption">위에서 제품을 찾아 &quot;추가&quot;를 눌러 주세요</Typography>
      </Box>
    )
  }

  return (
    <>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {quoteItems.map((item, index) => (
          <Box
            component="li"
            key={item.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: ROW_COLUMNS,
              gridTemplateAreas: ROW_AREAS,
              alignItems: 'center',
              columnGap: 2,
              rowGap: 1,
              py: 1.75,
              borderTop: index === 0 ? 'none' : '1px solid',
              borderColor: ROW_BORDER,
            }}
          >
            <Box sx={{ gridArea: 'item', display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              {item.image ? (
                <Box component="img" src={item.image} alt="" sx={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
              ) : (
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#F3F4F6',
                    borderRadius: 1,
                    fontSize: '0.6875rem',
                    color: 'text.secondary',
                  }}
                >
                  직접입력
                </Box>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  단가 {formatPrice(item.price)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ gridArea: 'qty' }}>
              <QuantityStepper value={item.quantity} name={item.name} onChange={(quantity) => changeQuoteQuantity(item.id, quantity)} />
            </Box>
            <Typography
              sx={{
                gridArea: 'total',
                textAlign: 'right',
                fontWeight: 700,
                fontSize: item.price === null ? '0.875rem' : '1rem',
                color: item.price === null ? 'text.secondary' : 'text.primary',
              }}
            >
              {item.price === null ? '별도 안내' : `₩ ${(item.price * item.quantity).toLocaleString()}`}
            </Typography>
            <Box sx={{ gridArea: 'remove', textAlign: 'right' }}>
              <IconButton size="small" aria-label={`${item.name} 삭제`} onClick={() => removeFromQuote(item.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button color="inherit" size="small" onClick={clearQuote} sx={{ color: 'text.secondary' }}>
          목록 비우기
        </Button>
      </Box>
    </>
  )
}

export default QuoteItemList
