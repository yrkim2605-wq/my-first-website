// Context 객체만 모아둔 파일이에요.
// Provider(context/*.jsx)와 hook(hooks/*.js)이 함께 가져다 써요.
import { createContext } from 'react'

export const BusanBakeriesContext = createContext(null)
export const RealBakeryPhotosContext = createContext(null)
export const VisitedBakeriesContext = createContext(null)
export const ProfileContext = createContext(null)
export const ReviewsContext = createContext(null)
