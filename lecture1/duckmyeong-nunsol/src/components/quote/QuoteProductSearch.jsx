import { useState } from 'react'
import { Box, Button, Chip, MenuItem, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { CATEGORIES } from '../../constants/siteData'
import useShop from '../../hooks/useShop'
import { getCategoryName, searchProducts } from '../../utils/productSearch'

// 견적 제품 검색: 분류 + 검색어로 찾아서 견적 목록에 추가
const QuoteProductSearch = () => {
  const { quoteItems, addToQuote, notify } = useShop()
  const [categoryId, setCategoryId] = useState('')
  const [keyword, setKeyword] = useState('')
  // 검색 버튼을 누른 시점의 조건 (입력 중에는 결과가 바뀌지 않게)
  const [searched, setSearched] = useState(null)

  const results = searched ? searchProducts(searched.keyword, searched.categoryId || null) : []

  const handleSubmit = (event) => {
    event.preventDefault()
    setSearched({ categoryId, keyword: keyword.trim() })
  }

  const handleAdd = (product) => {
    addToQuote(product)
    notify(`견적 목록에 담았어요: ${product.name}`)
  }

  const getQuotedQuantity = (id) => quoteItems.find((item) => item.id === id)?.quantity ?? 0

  return (
    <>
      <Box
        component="form"
        role="search"
        aria-label="견적 제품 검색"
        onSubmit={handleSubmit}
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr auto' }, gap: 1.5 }}
      >
        <TextField
          select
          size="small"
          label="분류"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <MenuItem value="">전체분류</MenuItem>
          {CATEGORIES.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="검색어"
          placeholder="제품명, 브랜드를 입력해 보세요"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button type="submit" variant="contained" color="secondary" startIcon={<SearchIcon />} sx={{ px: 3 }}>
          제품검색
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        {!searched && (
          <Typography variant="body2" color="text.secondary">
            분류와 검색어를 고른 뒤 &quot;제품검색&quot;을 누르세요. 검색어 없이 누르면 전체 상품이 나와요.
          </Typography>
        )}

        {searched && results.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            찾으시는 제품이 없어요. 아래 &quot;미등록 상품 견적추가&quot;로 직접 적어 주시면 확인해서 안내해 드려요.
          </Typography>
        )}

        {results.length > 0 && (
          <>
            <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              검색 결과 {results.length}개
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {results.map((product, index) => {
                const quoted = getQuotedQuantity(product.id)
                return (
                  <Box
                    component="li"
                    key={product.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderTop: index === 0 ? 'none' : '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box component="img" src={product.image} alt="" loading="lazy" sx={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getCategoryName(product.category)} ·{' '}
                        {product.price === null ? '가격문의' : `₩ ${product.price.toLocaleString()}`}
                      </Typography>
                    </Box>
                    {quoted > 0 && <Chip size="small" color="primary" variant="outlined" label={`담김 ${quoted}`} />}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAdd(product)}
                      aria-label={`${product.name} 견적에 추가`}
                      sx={{ flexShrink: 0 }}
                    >
                      견적 추가
                    </Button>
                  </Box>
                )
              })}
            </Box>
          </>
        )}
      </Box>
    </>
  )
}

export default QuoteProductSearch
