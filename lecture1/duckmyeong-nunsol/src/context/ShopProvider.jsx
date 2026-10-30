import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Snackbar } from '@mui/material'
import CartDrawer from '../components/shop/CartDrawer'
import QuoteDialog from '../components/shop/QuoteDialog'
import { MAX_ORDER_QUANTITY } from '../constants/siteData'
import { ShopContext } from './shopContext'

const CART_KEY = 'dmns-cart'
const WISH_KEY = 'dmns-wishlist'
const QUOTE_KEY = 'dmns-quote'
const MAX_QUANTITY = MAX_ORDER_QUANTITY

// localStorage가 막힌 환경(시크릿 모드 등)에서도 사이트가 멈추지 않도록 감싸서 읽고 씀
const readStorage = (key, fallback) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return Array.isArray(saved) ? saved : fallback
  } catch {
    return fallback
  }
}

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 실패: 이번 방문 동안만 유지됨
  }
}

// 장바구니에는 상품 전체를 저장 (가격이 바뀌어도 담을 때 보던 정보 그대로 보여주기 위함)
// items: [{ id, name, price, image, brand, quantity }]
export const ShopProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => readStorage(CART_KEY, []))
  const [wishIds, setWishIds] = useState(() => readStorage(WISH_KEY, []))
  // 온라인견적 목록: 장바구니와 따로 관리 (가격문의 상품·미등록 상품도 담을 수 있어서 price가 null일 수 있음)
  const [quoteItems, setQuoteItems] = useState(() => readStorage(QUOTE_KEY, []))
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quoteProduct, setQuoteProduct] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success', action: null })

  useEffect(() => writeStorage(CART_KEY, cartItems), [cartItems])
  useEffect(() => writeStorage(WISH_KEY, wishIds), [wishIds])
  useEffect(() => writeStorage(QUOTE_KEY, quoteItems), [quoteItems])

  // action: { label, onClick } 를 주면 알림 옆에 버튼이 생김 (예: "견적서 보기")
  const notify = useCallback((message, severity = 'success', action = null) => {
    setToast({ open: true, message, severity, action })
  }, [])

  const addToCart = useCallback(
    (product) => {
      setCartItems((prev) => {
        const found = prev.find((item) => item.id === product.id)
        if (found) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) } : item,
          )
        }
        const { id, name, price, image, brand } = product
        return [...prev, { id, name, price, image, brand, quantity: 1 }]
      })
      notify(`장바구니에 담았어요: ${product.name}`)
    },
    [notify],
  )

  const changeQuantity = useCallback((id, quantity) => {
    const next = Math.min(Math.max(quantity, 1), MAX_QUANTITY)
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: next } : item)))
  }, [])

  const removeFromCart = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  const addToQuote = useCallback((product, quantity = 1) => {
    setQuoteItems((prev) => {
      const found = prev.find((item) => item.id === product.id)
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) } : item,
        )
      }
      const { id, name, price = null, image = null, brand = '' } = product
      return [...prev, { id, name, price, image, brand, quantity: Math.min(quantity, MAX_QUANTITY) }]
    })
  }, [])

  const changeQuoteQuantity = useCallback((id, quantity) => {
    const next = Math.min(Math.max(quantity, 1), MAX_QUANTITY)
    setQuoteItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: next } : item)))
  }, [])

  const removeFromQuote = useCallback((id) => {
    setQuoteItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearQuote = useCallback(() => setQuoteItems([]), [])

  const toggleWish = useCallback(
    (product) => {
      setWishIds((prev) => {
        const isWished = prev.includes(product.id)
        notify(isWished ? '찜 목록에서 뺐어요' : '찜 목록에 담았어요')
        return isWished ? prev.filter((id) => id !== product.id) : [...prev, product.id]
      })
    },
    [notify],
  )

  const value = useMemo(
    () => ({
      cartItems,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      cartTotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      wishIds,
      quoteItems,
      // 가격이 있는 상품만 합산 (가격문의·미등록 상품은 합계에서 제외)
      quoteTotal: quoteItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
      quoteCount: quoteItems.reduce((sum, item) => sum + item.quantity, 0),
      addToQuote,
      changeQuoteQuantity,
      removeFromQuote,
      clearQuote,
      addToCart,
      changeQuantity,
      removeFromCart,
      clearCart,
      toggleWish,
      openCart: () => setIsCartOpen(true),
      openQuote: setQuoteProduct,
      notify,
    }),
    [cartItems, wishIds, quoteItems, addToQuote, changeQuoteQuantity, removeFromQuote, clearQuote, addToCart, changeQuantity, removeFromCart, clearCart, toggleWish, notify],
  )

  return (
    <ShopContext.Provider value={value}>
      {children}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <QuoteDialog product={quoteProduct} onClose={() => setQuoteProduct(null)} />
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.action ? 6000 : 2500}
        onClose={(event, reason) => reason !== 'clickaway' && setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={toast.action ? undefined : () => setToast((prev) => ({ ...prev, open: false }))}
          action={
            toast.action && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  toast.action.onClick()
                  setToast((prev) => ({ ...prev, open: false }))
                }}
              >
                {toast.action.label}
              </Button>
            )
          }
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ShopContext.Provider>
  )
}
