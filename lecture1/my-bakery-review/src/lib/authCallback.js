// 이메일 링크가 오류와 함께 돌아오면 Supabase는 주소 뒤에 "#error=…&error_code=otp_expired"를 붙여요.
// 이 앱은 HashRouter라서 그대로 두면 "#/주소"로 오해해 빈 화면이 돼요.
// 그래서 라우터가 시작되기 전에 오류만 꺼내 두고, 주소는 로그인 화면(#/login)으로 바꿔요.

const STORAGE_KEY = 'my-bakery-review:auth-callback-error'

export const captureAuthCallbackError = () => {
  const { hash } = window.location
  if (!/^#(error|error_code)=/.test(hash) && !/[#&]error_code=/.test(hash)) return
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  try {
    sessionStorage.setItem(STORAGE_KEY, params.get('error_code') || 'unknown')
  } catch {
    // 저장이 막혀 있으면 안내만 못 보여줘요
  }
  const url = new URL(window.location.href)
  url.hash = '#/login'
  window.history.replaceState({}, '', url.toString())
}

// 저장해 둔 오류 코드를 한 번만 꺼내 써요 (없으면 null)
export const takeAuthCallbackError = () => {
  try {
    const code = sessionStorage.getItem(STORAGE_KEY)
    if (code) sessionStorage.removeItem(STORAGE_KEY)
    return code
  } catch {
    return null
  }
}
