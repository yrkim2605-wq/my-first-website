import { useEffect } from 'react'

// 페이지에 들어오면 탭 제목을 바꾸고, 나갈 때 원래대로 돌려놓음
const usePageTitle = (title) => {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}

export default usePageTitle
