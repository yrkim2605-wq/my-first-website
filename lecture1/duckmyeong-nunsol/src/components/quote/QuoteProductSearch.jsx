import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { CATEGORIES, MAX_ORDER_QUANTITY } from '../../constants/siteData'
import useShop from '../../hooks/useShop'
import { getCategoryName, searchProducts } from '../../utils/productSearch'

const ROW_BORDER = '#F0F1F3'
// 처음에는 이만큼만 보여주고 나머지는 "더 보기"로 펼침 (목록 안쪽 스크롤은 페이지 스크롤을 가로막아서 쓰지 않음)
const INITIAL_VISIBLE_COUNT = 5

// 견적 제품 찾기: 분류·검색어를 바꾸면 바로 결과가 바뀌고, 목록에 없는 제품은 직접 적어서 추가
const QuoteProductSearch = () => {
  const { quoteItems, addToQuote, notify } = useShop()
  const [categoryId, setCategoryId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')
  const [isCustomTouched, setIsCustomTouched] = useState(false)

  const results = searchProducts(keyword, categoryId || null)
  const visibleResults = isExpanded ? results : results.slice(0, INITIAL_VISIBLE_COUNT)
  const hiddenCount = results.length - visibleResults.length
  const getQuotedQuantity = (id) => quoteItems.find((item) => item.id === id)?.quantity ?? 0

  const handleAdd = (product) => {
    addToQuote(product)
    notify(`견적 목록에 담았어요: ${product.name}`)
  }

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
    notify('직접 입력한 제품을 견적 목록에 담았어요')
    closeCustom()
  }

  return (
    <>
      <Box
        role="search"
        aria-label="견적 제품 검색"
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5 }}
      >
        <TextField select size="small" label="분류" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <MenuItem value="">전체분류</MenuItem>
          {CATEGORIES.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="제품명 · 브랜드 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Typography role="status" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, mb: 0.5 }}>
        {results.length > 0 ? `제품 ${results.length}개` : '조건에 맞는 제품이 없어요'}
      </Typography>

      {results.length > 0 && (
        <Box component="ul" aria-label="검색된 제품 목록" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {visibleResults.map((product, index) => {
            const quoted = getQuotedQuantity(product.id)
            return (
              <Box
                component="li"
                key={product.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.25,
                  borderTop: index === 0 ? 'none' : '1px solid',
                  borderColor: ROW_BORDER,
                }}
              >
                <Box component="img" src={product.image} alt="" loading="lazy" sx={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getCategoryName(product.category)} · {product.price === null ? '가격문의' : `₩ ${product.price.toLocaleString()}`}
                  </Typography>
                </Box>
                {quoted > 0 && <Chip size="small" color="primary" variant="outlined" label={`담김 ${quoted}`} />}
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleAdd(product)}
                  aria-label={`${product.name} 견적에 추가`}
                  sx={{ flexShrink: 0, borderColor: '#D5D8DD' }}
                >
                  추가
                </Button>
              </Box>
            )
          })}
        </Box>
      )}

      {(hiddenCount > 0 || isExpanded) && results.length > INITIAL_VISIBLE_COUNT && (
        <Button
          color="inherit"
          size="small"
          fullWidth
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          sx={{ mt: 0.5, color: 'text.secondary' }}
        >
          {isExpanded ? '접기' : `나머지 ${hiddenCount}개 더 보기`}
        </Button>
      )}

      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: '#D5D8DD', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          찾는 제품이 목록에 없나요?
        </Typography>
        <Button size="small" onClick={() => setIsCustomOpen(true)}>
          직접 입력해서 추가
        </Button>
      </Box>

      <Dialog open={isCustomOpen} onClose={closeCustom} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCustomSubmit} noValidate>
          <DialogTitle sx={{ fontWeight: 700 }}>직접 입력해서 추가</DialogTitle>
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
              helperText={isCustomTouched && !customName.trim() ? '제품명(모델명)을 입력해 주세요' : ' '}
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

export default QuoteProductSearch
