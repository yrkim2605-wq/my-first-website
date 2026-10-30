import { useCallback } from 'react'
import useShop from '../hooks/useShop'
import { COMPANY_INFO } from '../constants/siteData'

// 메뉴 항목의 action을 실제 동작으로 바꿔 줌 (데스크톱 메뉴와 모바일 메뉴가 같이 사용)
const useNavAction = () => {
  const { openQuote, notify } = useShop()

  return useCallback(
    ({ id, action }) => {
      switch (action.type) {
        case 'quote':
          openQuote({ id, name: action.title })
          break
        case 'scroll':
          document.getElementById(action.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          break
        case 'tel':
          window.location.href = `tel:${COMPANY_INFO.tel.replace(/-/g, '')}`
          break
        default:
          notify(`준비 중인 메뉴예요. 대표전화 ${COMPANY_INFO.tel}로 문의해 주세요.`, 'info')
      }
    },
    [openQuote, notify],
  )
}

export default useNavAction
