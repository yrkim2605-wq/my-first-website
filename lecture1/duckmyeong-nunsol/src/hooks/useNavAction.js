import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useShop from './useShop'
import { COMPANY_INFO } from '../constants/siteData'
import { NAVIGATION_SETTLE_MS, scrollToId } from '../utils/scroll'

// 메뉴 항목의 action을 실제 동작으로 바꿔 줌 (데스크톱 메뉴와 모바일 메뉴, 푸터가 같이 사용)
const useNavAction = () => {
  const { openQuote, notify } = useShop()
  const navigate = useNavigate()

  return useCallback(
    ({ id, action }) => {
      switch (action.type) {
        case 'quote':
          openQuote({ id, name: action.title })
          break
        case 'route':
          navigate(action.to)
          break
        case 'scroll':
          // 대상이 없는 페이지(예: 온라인견적)에서는 홈으로 돌아간 뒤 이동
          if (document.getElementById(action.target)) {
            scrollToId(action.target)
          } else {
            navigate('/')
            setTimeout(() => scrollToId(action.target), NAVIGATION_SETTLE_MS)
          }
          break
        case 'tel':
          window.location.href = `tel:${COMPANY_INFO.tel.replace(/-/g, '')}`
          break
        default:
          notify(`준비 중인 메뉴예요. 대표전화 ${COMPANY_INFO.tel}로 문의해 주세요.`, 'info')
      }
    },
    [openQuote, notify, navigate],
  )
}

export default useNavAction
