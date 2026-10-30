import { useCallback, useState } from 'react'

const INITIAL_FILTER = { query: '', categoryId: null, isShowAll: false }

// 상품 목록 영역으로 부드럽게 이동 (필터가 바뀐 뒤 화면이 그려진 다음에 실행)
const scrollToProducts = () => {
  requestAnimationFrame(() => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// 검색어 · 카테고리 · 전체보기 상태를 한곳에서 관리
const useProductFilter = () => {
  const [filter, setFilter] = useState(INITIAL_FILTER)

  const search = useCallback((query) => {
    setFilter((prev) => ({ ...prev, query: query.trim(), isShowAll: false }))
    scrollToProducts()
  }, [])

  // 메뉴에서 고를 때: 이미 선택된 분류를 다시 골라도 해제되지 않음
  const selectCategory = useCallback((categoryId) => {
    setFilter((prev) => ({ ...prev, categoryId, isShowAll: false }))
    scrollToProducts()
  }, [])

  const toggleCategory = useCallback((categoryId) => {
    setFilter((prev) => ({ ...prev, categoryId: prev.categoryId === categoryId ? null : categoryId, isShowAll: false }))
    scrollToProducts()
  }, [])

  const showAll = useCallback(() => {
    setFilter({ ...INITIAL_FILTER, isShowAll: true })
  }, [])

  const clear = useCallback(() => setFilter(INITIAL_FILTER), [])

  const isFiltering = Boolean(filter.query || filter.categoryId || filter.isShowAll)

  return { filter, isFiltering, search, selectCategory, toggleCategory, showAll, clear }
}

export default useProductFilter
