import { Box, Button, Divider, Drawer, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import useShop from '../../hooks/useShop'
import QuantityStepper from '../common/QuantityStepper'

const CartDrawer = ({ open, onClose }) => {
  const { cartItems, cartCount, cartTotal, changeQuantity, removeFromCart, clearCart, notify } = useShop()

  const handleOrder = () => {
    // 데모 사이트라 실제 결제는 연결하지 않음
    notify('데모 사이트라 실제 주문은 진행되지 않아요. 주문은 1644-9879로 문의해 주세요.', 'info')
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, height: 60, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h3" sx={{ flex: 1 }}>
          장바구니{' '}
          <Box component="span" sx={{ color: 'primary.main' }}>
            {cartCount}
          </Box>
        </Typography>
        <IconButton aria-label="장바구니 닫기" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {cartItems.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.secondary' }}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 56, opacity: 0.4 }} />
          <Typography>장바구니가 비어 있어요</Typography>
          <Button variant="outlined" onClick={onClose}>
            쇼핑 계속하기
          </Button>
        </Box>
      ) : (
        <>
          <Box component="ul" sx={{ flex: 1, overflowY: 'auto', listStyle: 'none', m: 0, p: 0 }}>
            {cartItems.map((item) => (
              <Box
                component="li"
                key={item.id}
                sx={{ display: 'flex', gap: 1.5, p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Box
                  component="img"
                  src={item.image}
                  alt=""
                  sx={{ width: 72, height: 72, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5, wordBreak: 'keep-all' }}>
                      {item.name}
                    </Typography>
                    <IconButton size="small" aria-label={`${item.name} 삭제`} onClick={() => removeFromCart(item.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <QuantityStepper
                      value={item.quantity}
                      name={item.name}
                      onChange={(quantity) => changeQuantity(item.id, quantity)}
                    />
                    <Typography sx={{ fontWeight: 700 }}>₩ {(item.price * item.quantity).toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
              <Typography color="text.secondary">상품 합계</Typography>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: 'primary.main' }}>
                ₩ {cartTotal.toLocaleString()}
              </Typography>
            </Box>
            <Button variant="contained" size="large" fullWidth onClick={handleOrder}>
              주문하기
            </Button>
            <Divider sx={{ my: 1.5, visibility: 'hidden' }} />
            <Button color="inherit" size="small" fullWidth onClick={clearCart} sx={{ color: 'text.secondary' }}>
              장바구니 비우기
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  )
}

export default CartDrawer
