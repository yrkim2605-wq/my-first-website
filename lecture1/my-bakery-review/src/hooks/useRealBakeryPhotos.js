import { useContext } from 'react'
import { RealBakeryPhotosContext } from '../context/contexts'

export const useRealBakeryPhotos = () => {
  const ctx = useContext(RealBakeryPhotosContext)
  if (!ctx) {
    throw new Error('useRealBakeryPhotos는 RealBakeryPhotosProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
