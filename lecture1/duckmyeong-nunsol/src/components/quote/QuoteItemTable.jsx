import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { MAX_ORDER_QUANTITY } from '../../constants/siteData'
import useShop from '../../hooks/useShop'
import QuantityStepper from '../common/QuantityStepper'

// 데스크톱: 한 줄에 [상품 | 단가 | 수량 | 소계 | 삭제] / 모바일: 상품 위, 수량·소계 아래 (표 대신 카드형)
const ROW_COLUMNS = { xs: '1fr auto', md: '1fr 130px 130px 130px 48px' }
const ROW_AREAS = { xs: '"item remove" "qty total"', md: '"item price qty total remove"' }

const formatPrice = (price) => (price === null ? '가격문의' : `₩ ${price.toLocaleString()}`)

const HEADER_CELLS = [
  { label: '상품명', align: 'left' },
  { label: '단가(정가)', align: 'center' },
  { label: '수량', align: 'center' },
  { label: '소계', align: 'center' },
  { label: '삭제', align: 'center' },
]

// 견적 제품 관리: 담은 제품의 수량 조절 · 삭제 · 합계, 목록에 없는 제품 직접 추가
const QuoteItemTable = () => {
  const { quoteItems, quoteCount, quoteTotal, changeQuoteQuantity, removeFromQuote, clearQuote, addToQuote, notify } = useShop()
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')
  const [isCustomTouched, setIsCustomTouched] = useState(false)

  const inquiryCount = quoteItems.filter((item) => item.price === null).length
  const nameError = isCustomTouched && !customName.trim() ? '제품명(모델명)을 입력해 주세요' : ' '

  const closeCustom = () => {
    setIsCustomOpen(false)
    setCustomName('')
    setCustomQuantity('1')
    setIsCustomTouched(false)
  }

  const handleCustomSubmit = (event) => {
    event.preventDefault()
    setIsCustomTouched(true)
    if (!customName.trim()) return
    const quantity = Math.min(Math.max(Math.floor(Number(customQuantity)) || 1, 1), MAX_ORDER_QUANTITY)
    addToQuote({ id: `custom-${Date.now()}`, name: customName.trim(), price: null }, quantity)
    notify('미등록 상품을 견적 목록에 담았어요')
    closeCustom()
  }

  return (
    <>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {/* 머리글: 모바일에서는 숨김 */}
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: ROW_COLUMNS.md,
            bgcolor: '#F5F6F8',
            py: 1.25,
            px: 1.5,
            fontSize: '0.875rem',
            fontWeight: 700,
          }}
        >
          {HEADER_CELLS.map(({ label, align }) => (
            <Box key={label} sx={{ textAlign: align }}>
              {label}
            </Box>
          ))}
        </Box>

        {quoteItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
            견적 목록이 비어 있어요. 위에서 제품을 검색해 추가해 주세요.
          </Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {quoteItems.map((item) => (
              <Box
                component="li"
                key={item.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: ROW_COLUMNS,
                  gridTemplateAreas: ROW_AREAS,
                  alignItems: 'center',
                  columnGap: 1,
                  rowGap: 1,
                  py: 1.5,
                  px: 1.5,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ gridArea: 'item', display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  {item.image ? (
                    <Box component="img" src={item.image} alt="" sx={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: '#F5F6F8', borderRadius: 1, display: 'grid', placeItems: 'center', fontSize: '0.6875rem', color: 'text.secondary' }}>
                      미등록
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
                      {item.name}
                    </Typography>
                    {/* 모바일에서는 단가 칸이 없어서 상품명 아래에 보여줌 */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: { md: 'none' } }}>
                      단가 {formatPrice(item.price)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ gridArea: 'price', textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
                  {formatPrice(item.price)}
                </Typography>
                <Box sx={{ gridArea: 'qty', textAlign: { xs: 'left', md: 'center' } }}>
                  <QuantityStepper value={item.quantity} name={item.name} onChange={(quantity) => changeQuoteQuantity(item.id, quantity)} />
                </Box>
                <Typography sx={{ gridArea: 'total', textAlign: { xs: 'right', md: 'center' }, fontWeight: 700 }}>
                  {item.price === null ? '별도 안내' : `₩ ${(item.price * item.quantity).toLocaleString()}`}
                </Typography>
                <Box sx={{ gridArea: 'remove', textAlign: 'center' }}>
                  <IconButton size="small" aria-label={`${item.name} 삭제`} onClick={() => removeFromQuote(item.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* 합계 */}
        <Box
          role="status"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 1,
            px: 2,
            py: 1.5,
            bgcolor: '#F5F6F8',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            수량 : {quoteCount} / 품목 : {quoteItems.length} 종
            {inquiryCount > 0 && ` (가격문의 ${inquiryCount}종은 합계에서 제외)`}
          </Typography>
          <Typography>
            견적 정가{' '}
            <Box component="span" sx={{ ml: 1, fontSize: '1.25rem', fontWeight: 700, color: 'primary.main' }}>
              ₩ {quoteTotal.toLocaleString()}
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {quoteItems.length > 0 && (
          <Button color="inherit" onClick={clearQuote} sx={{ color: 'text.secondary' }}>
            목록 비우기
          </Button>
        )}
        <Button variant="contained" color="secondary" onClick={() => setIsCustomOpen(true)}>
          미등록 상품 견적추가
        </Button>
      </Box>

      <Dialog open={isCustomOpen} onClose={closeCustom} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCustomSubmit} noValidate>
          <DialogTitle sx={{ fontWeight: 700 }}>미등록 상품 견적추가</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'keep-all' }}>
              사이트에 없는 제품도 제품명이나 모델명을 적어 주시면 확인해서 견적을 드려요.
            </Typography>
            <TextField
              autoFocus
              required
              fullWidth
              size="small"
              label="제품명 / 모델명"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              error={isCustomTouched && !customName.trim()}
              helperText={nameError}
              sx={{ mb: 0.5 }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="수량"
              value={customQuantity}
              onChange={(event) => setCustomQuantity(event.target.value)}
              slotProps={{ htmlInput: { min: 1, max: MAX_ORDER_QUANTITY }, inputLabel: { shrink: true } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button color="inherit" onClick={closeCustom}>
              취소
            </Button>
            <Button type="submit" variant="contained">
              추가
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  )
}

export default QuoteItemTable
