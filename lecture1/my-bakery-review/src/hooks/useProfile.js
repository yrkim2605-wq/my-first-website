import { useContext } from 'react'
import { ProfileContext } from '../context/contexts'

export const useProfile = () => {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile은 ProfileProvider 안에서만 사용할 수 있어요.')
  return ctx
}
