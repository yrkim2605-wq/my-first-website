import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import CartDrawer from '../components/shop/CartDrawer'
import QuoteDialog from '../components/shop/QuoteDialog'
import { ShopContext } from './shopContext'

const CART_KEY = 'dmns-cart'
const WISH_KEY = 'dmns-wishlist'
const MAX_QUANTITY = 99

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
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quoteProduct, setQuoteProduct] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => writeStorage(CART_KEY, cartItems), [cartItems])
  useEffect(() => writeStorage(WISH_KEY, wishIds), [wishIds])

  const notify = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity })
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
      addToCart,
      changeQuantity,
      removeFromCart,
      clearCart,
      toggleWish,
      openCart: () => setIsCartOpen(true),
      openQuote: setQuoteProduct,
      notify,
    }),
    [cartItems, wishIds, addToCart, changeQuantity, removeFromCart, clearCart, toggleWish, notify],
  )

  return (
    <ShopContext.Provider value={value}>
      {children}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <QuoteDialog product={quoteProduct} onClose={() => setQuoteProduct(null)} />
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={(event, reason) => reason !== 'clickaway' && setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ShopContext.Provider>
  )
}
