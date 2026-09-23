import { createContext, useContext, useEffect, useState } from 'react'
import { searchBakeriesByKeyword } from '../api/kakaoLocal'
import { DISTRICTS } from '../constants/districts'
import defaultBakeryIcon from '../assets/section-icons/icon-default-bakery.png'
import cafeStrawberryIcon from '../assets/section-icons/icon-cafe-strawberry.png'
import croissantIcon from '../assets/section-icons/icon-croissant.png'
import saltBreadIcon from '../assets/section-icons/icon-saltbread.png'
import donutIcon from '../assets/section-icons/icon-donut.png'
import bagelIcon from '../assets/section-icons/icon-bagel.png'
import baguetteIcon from '../assets/section-icons/icon-baguette.png'
import toastIcon from '../assets/section-icons/icon-toast.png'
import fillerIconA from '../assets/section-icons/icon-filler-a.png'
import fillerIconB from '../assets/section-icons/icon-filler-b.png'

const BusanBakeriesContext = createContext(null)

// 카카오 API는 대표메뉴 정보를 안 줘서, 품목명으로 직접 검색해 걸리는 가게를
// 그 품목의 대표메뉴로 간주한다. 아이콘은 전부 제공받은 스프라이트에서 자른 이미지만 쓴다(이모지 사용 안 함).
const SPECIALTY_QUERIES = [
  { term: '크루아상', iconImage: croissantIcon, label: '크루아상' },
  { term: '소금빵', iconImage: saltBreadIcon, label: '소금빵' },
  { term: '도넛', iconImage: donutIcon, label: '도넛' },
  { term: '베이글', iconImage: bagelIcon, label: '베이글' },
  { term: '마카롱', iconImage: fillerIconA, label: '마카롱' },
  { term: '크로플', iconImage: croissantIcon, label: '크로플' },
  { term: '카페', iconImage: cafeStrawberryIcon, label: '카페 디저트' },
  { term: '케이크', iconImage: cafeStrawberryIcon, label: '케이크' },
  { term: '바게트', iconImage: baguetteIcon, label: '바게트' },
  { term: '식빵', iconImage: toastIcon, label: '식빵' },
]

const NAME_KEYWORD_RULES = SPECIALTY_QUERIES.map(({ term, iconImage, label }) => ({
  keywords: [term],
  iconImage,
  label,
}))

const FALLBACK_ICON_POOL = [defaultBakeryIcon, fillerIconB, fillerIconA]

const hashStringToIndex = (str, poolSize) => {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) % poolSize
  }
  return Math.abs(hash) % poolSize
}

const buildSignatureMenuMap = async (districtName) => {
  const map = new Map()
  const resultsPerSpecialty = await Promise.all(
    SPECIALTY_QUERIES.map(({ term }) => searchBakeriesByKeyword(`${districtName} ${term}`)),
  )
  resultsPerSpecialty.forEach((docs, index) => {
    const specialty = SPECIALTY_QUERIES[index]
    docs.forEach((doc) => {
      if (!map.has(doc.id)) {
        map.set(doc.id, specialty)
      }
    })
  })
  return map
}

const getBakeryIcon = (doc, signatureMenuMap) => {
  const bySpecialtySearch = signatureMenuMap.get(doc.id)
  if (bySpecialtySearch) {
    return {
      iconImage: bySpecialtySearch.iconImage,
      signatureMenu: bySpecialtySearch.label,
    }
  }

  const text = `${doc.place_name} ${doc.category_name}`
  const byName = NAME_KEYWORD_RULES.find((rule) => rule.keywords.some((kw) => text.includes(kw)))
  if (byName) {
    return { iconImage: byName.iconImage, signatureMenu: byName.label }
  }

  const fallbackIcon = FALLBACK_ICON_POOL[hashStringToIndex(String(doc.id), FALLBACK_ICON_POOL.length)]
  return { iconImage: fallbackIcon, signatureMenu: '' }
}

const normalizeBakery = (doc, districtId, signatureMenuMap) => ({
  id: doc.id,
  name: doc.place_name,
  districtId,
  address: doc.road_address_name || doc.address_name,
  rating: 0,
  heartCount: 0,
  tags: [],
  ...getBakeryIcon(doc, signatureMenuMap),
  description: doc.category_name.split('>').pop().trim(),
  phone: doc.phone,
  placeUrl: doc.place_url,
  lat: Number(doc.y),
  lng: Number(doc.x),
})

export const BusanBakeriesProvider = ({ children }) => {
  const [bakeries, setBakeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const resultsByDistrict = await Promise.all(
          DISTRICTS.map(async (district) => {
            const [docs, signatureMenuMap] = await Promise.all([
              searchBakeriesByKeyword(`${district.name} 빵집`),
              buildSignatureMenuMap(district.name),
            ])
            return docs.map((doc) => normalizeBakery(doc, district.id, signatureMenuMap))
          }),
        )

        const seen = new Set()
        const merged = resultsByDistrict.flat().filter((bakery) => {
          if (seen.has(bakery.id)) return false
          seen.add(bakery.id)
          return true
        })

        if (!cancelled) {
          setBakeries(merged)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <BusanBakeriesContext.Provider value={{ bakeries, loading, error }}>
      {children}
    </BusanBakeriesContext.Provider>
  )
}

export const useBusanBakeries = () => {
  const ctx = useContext(BusanBakeriesContext)
  if (!ctx) {
    throw new Error('useBusanBakeries는 BusanBakeriesProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
