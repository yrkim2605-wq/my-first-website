import { useContext } from 'react'
import { ShopContext } from '../context/shopContext'

const useShop = () => {
  const context = useContext(ShopContext)
  if (!context) throw new Error('useShop은 ShopProvider 안에서만 쓸 수 있어요')
  return context
}

export default useShop
