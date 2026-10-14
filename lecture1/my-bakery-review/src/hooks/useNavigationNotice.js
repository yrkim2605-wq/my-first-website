import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// 다른 화면에서 이동해 오면서 넘겨 준 안내 한 줄을 한 번만 보여줘요 (예: "글은 지웠지만 사진 파일을 서버에서 지우지 못했어요").
// 읽은 뒤에는 주소의 이동 기록(state)을 비워서, 새로고침해도 같은 안내가 다시 나타나지 않아요.
// 돌려주는 값: [안내 문구 | null, 안내 닫기 함수]
export const useNavigationNotice = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const arrived = location.state?.notice ?? null
  const [notice, setNotice] = useState(arrived)

  useEffect(() => {
    if (arrived) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [arrived, location.pathname, location.search, navigate])

  return [notice, () => setNotice(null)]
}
