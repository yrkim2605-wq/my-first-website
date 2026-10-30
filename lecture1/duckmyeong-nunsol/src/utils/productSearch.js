import { BRANDS, CATEGORIES, PRODUCTS, SENSOR_CATEGORY } from '../constants/siteData'

const MAX_SUGGESTIONS = 6

// 카드 8개 + 카드에는 없는 정밀센서측정(인터페이스 유닛, EJ 카운터가 속함)
export const PRODUCT_CATEGORIES = [...CATEGORIES, SENSOR_CATEGORY]

const CATEGORY_NAMES = Object.fromEntries(PRODUCT_CATEGORIES.map(({ id, name }) => [id, name]))

// 영문 브랜드명 → 한글 브랜드명 (Mitutoyo → 미쓰도요): 한글로 검색해도 찾을 수 있게
const BRAND_KOREAN_NAMES = Object.fromEntries(BRANDS.map(({ logo, name }) => [logo.toLowerCase(), name]))

// 같은 상품이 여러 탭(인기·신상품)에 나오므로 이름 기준으로 한 번만 남김
export const ALL_PRODUCTS = [...new Map(Object.values(PRODUCTS).flat().map((product) => [product.name, product])).values()]

export const getCategoryName = (categoryId) => CATEGORY_NAMES[categoryId] ?? ''

// 비교할 때 달라도 같은 것으로 보는 차이를 없애는 정규화
//  - 대소문자, 띄어쓰기, 하이픈 (PH-3515F = ph3515f, CC-Link = cc link)
//  - 단위 표기: 기존 사이트의 ㎛·㎜와 μm·mm, 도 기호 ˚와 °
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/㎛/g, 'μm')
    .replace(/㎜/g, 'mm')
    .replace(/µ/g, 'μ')
    .replace(/°/g, '˚')
    .replace(/[\s-]+/g, '')

const buildHaystack = (product) =>
  normalize(
    `${product.name} ${product.brand} ${BRAND_KOREAN_NAMES[product.brand.toLowerCase()] ?? ''} ${getCategoryName(product.category)}`,
  )

// 검색어를 띄어쓰기로 나눠서 모든 단어가 들어 있는 상품만 찾음 (예: "마이크로 0.1" → 둘 다 포함)
export const searchProducts = (query, categoryId = null) => {
  const tokens = query.split(/\s+/).map(normalize).filter(Boolean)
  return ALL_PRODUCTS.filter((product) => {
    if (categoryId && product.category !== categoryId) return false
    const haystack = buildHaystack(product)
    return tokens.every((token) => haystack.includes(token))
  })
}

// 자동완성 제안: 검색어가 비어 있으면 보여주지 않음
export const getSuggestions = (query) => {
  if (!query.trim()) return []
  return searchProducts(query).slice(0, MAX_SUGGESTIONS)
}
