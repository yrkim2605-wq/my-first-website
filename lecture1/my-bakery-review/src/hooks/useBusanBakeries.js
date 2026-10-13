import { useContext } from 'react'
import { BusanBakeriesContext } from '../context/contexts'

export const useBusanBakeries = () => {
  const ctx = useContext(BusanBakeriesContext)
  if (!ctx) {
    throw new Error('useBusanBakeries는 BusanBakeriesProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
