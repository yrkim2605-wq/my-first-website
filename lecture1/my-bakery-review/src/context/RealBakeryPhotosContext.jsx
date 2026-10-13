import { useContext, useEffect, useMemo, useState } from 'react'
import { RealBakeryPhotosContext, ReviewsContext } from './contexts'

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
  const [legacyPhotosByBakeryId, setPhotosByBakeryId] = useState(loadInitialPhotos)
  const reviewsCtx = useContext(ReviewsContext)
  const reviews = reviewsCtx?.reviews

  // 대표 사진 = 그 빵집 리뷰에 붙은 가장 최근 사진. 없으면 예전에 저장해 둔 사진(legacy)을 써요.
  // (리뷰 사진은 리뷰 안에만 저장하고 따로 복사하지 않아서, 리뷰를 지우면 대표 사진도 함께 돌아가요.)
  const photosByBakeryId = useMemo(() => {
    const merged = { ...legacyPhotosByBakeryId }
    const newestFirst = [...(reviews ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const seen = new Set()
    newestFirst.forEach((review) => {
      if (review.photo && !seen.has(review.bakeryId)) {
        merged[review.bakeryId] = review.photo
        seen.add(review.bakeryId)
      }
    })
    return merged
  }, [legacyPhotosByBakeryId, reviews])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyPhotosByBakeryId))
    } catch {
      // localStorage 용량 초과 등은 조용히 무시하고 화면 표시만 계속 진행
    }
  }, [legacyPhotosByBakeryId])

  const setBakeryPhoto = (id, dataUrl) => {
    setPhotosByBakeryId((prev) => ({ ...prev, [id]: dataUrl }))
  }

  return (
    <RealBakeryPhotosContext.Provider value={{ photosByBakeryId, setBakeryPhoto }}>
      {children}
    </RealBakeryPhotosContext.Provider>
  )
}
