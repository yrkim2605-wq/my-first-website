import { CATEGORIES, PRODUCTS } from '../constants/siteData'

const MAX_SUGGESTIONS = 6

const CATEGORY_NAMES = Object.fromEntries(CATEGORIES.map(({ id, name }) => [id, name]))

// 같은 상품이 여러 탭(인기·신상품)에 나오므로 이름 기준으로 한 번만 남김
export const ALL_PRODUCTS = [...new Map(Object.values(PRODUCTS).flat().map((product) => [product.name, product])).values()]

export const getCategoryName = (categoryId) => CATEGORY_NAMES[categoryId] ?? ''

// 대소문자와 띄어쓰기를 무시하고 비교하기 위해 정규화
const normalize = (text) => text.toLowerCase().replace(/\s+/g, '')

const buildHaystack = (product) => normalize(`${product.name} ${product.brand} ${getCategoryName(product.category)}`)

// 검색어를 띄어쓰기로 나눠서 모든 단어가 들어 있는 상품만 찾음 (예: "마이크로 0.1" → 둘 다 포함)
export const searchProducts = (query, categoryId = null) => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
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
