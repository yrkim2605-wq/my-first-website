import { useEffect, useState } from 'react'
import { RealBakeryPhotosContext } from './contexts'

const STORAGE_KEY = 'my-bakery-review:real-bakery-photos'

const loadInitialPhotos = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const RealBakeryPhotosProvider = ({ children }) => {
  const [photosByBakeryId, setPhotosByBakeryId] = useState(loadInitialPhotos)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photosByBakeryId))
    } catch {
      // localStorage 용량 초과 등은 조용히 무시하고 화면 표시만 계속 진행
    }
  }, [photosByBakeryId])

  const setBakeryPhoto = (id, dataUrl) => {
    setPhotosByBakeryId((prev) => ({ ...prev, [id]: dataUrl }))
  }

  return (
    <RealBakeryPhotosContext.Provider value={{ photosByBakeryId, setBakeryPhoto }}>
      {children}
    </RealBakeryPhotosContext.Provider>
  )
}
