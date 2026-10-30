import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAVIGATION_SETTLE_MS, scrollToId } from '../utils/scroll'

const INITIAL_FILTER = { query: '', categoryId: null, isShowAll: false }

// 검색어 · 카테고리 · 전체보기 상태를 한곳에서 관리
// 다른 페이지(예: 온라인견적)에서 검색하거나 카테고리를 골라도 홈의 상품 목록으로 이동해서 보여줌
const useProductFilter = () => {
  const [filter, setFilter] = useState(INITIAL_FILTER)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // 상품 목록 영역으로 이동 (다른 페이지에 있었다면 홈으로 먼저 돌아감)
  const showProducts = useCallback(() => {
    if (pathname !== '/') {
      navigate('/')
      setTimeout(() => scrollToId('products'), NAVIGATION_SETTLE_MS)
      return
    }
    requestAnimationFrame(() => scrollToId('products'))
  }, [navigate, pathname])

  const search = useCallback(
    (query) => {
      setFilter((prev) => ({ ...prev, query: query.trim(), isShowAll: false }))
      showProducts()
    },
    [showProducts],
  )

  // 메뉴에서 고를 때: 이미 선택된 분류를 다시 골라도 해제되지 않음
  const selectCategory = useCallback(
    (categoryId) => {
      setFilter((prev) => ({ ...prev, categoryId, isShowAll: false }))
      showProducts()
    },
    [showProducts],
  )

  const toggleCategory = useCallback(
    (categoryId) => {
      setFilter((prev) => ({ ...prev, categoryId: prev.categoryId === categoryId ? null : categoryId, isShowAll: false }))
      showProducts()
    },
    [showProducts],
  )

  const showAll = useCallback(() => {
    setFilter({ ...INITIAL_FILTER, isShowAll: true })
  }, [])

  const clear = useCallback(() => setFilter(INITIAL_FILTER), [])

  const isFiltering = Boolean(filter.query || filter.categoryId || filter.isShowAll)

  return { filter, isFiltering, search, selectCategory, toggleCategory, showAll, clear }
}

export default useProductFilter
