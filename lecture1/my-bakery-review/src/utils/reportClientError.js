// 화면에서 예상하지 못한 오류가 났을 때 "기록"을 남기는 곳이에요.
//  - 지금은 브라우저 콘솔에만 남겨요 (이용자 정보 · 로그인 토큰은 오류 객체에 없어요. 어디에도 보내지 않아요).
//  - 나중에 오류 수집 서비스(Sentry 등)를 붙이면 이 함수 한 곳만 바꾸면 돼요.
//  - 'bakery:client-error' 이벤트도 같이 보내서, 수집 도구가 이벤트만 듣고도 붙을 수 있어요.

const shorten = (value, max = 500) => String(value ?? '').slice(0, max)

export const describeClientError = (error) => ({
  name: shorten(error?.name ?? typeof error, 80),
  message: shorten(error?.message ?? error),
  stack: shorten(error?.stack, 1500),
})

export const reportClientError = (error, context = {}) => {
  const detail = { ...describeClientError(error), ...context, at: new Date().toISOString() }
  console.error('[빵덕후 오류]', detail)
  try {
    window.dispatchEvent(new CustomEvent('bakery:client-error', { detail }))
  } catch {
    // 이벤트를 못 보내도 화면에는 영향이 없어요
  }
  return detail
}

// 새 버전을 배포한 뒤, 열려 있던 옛 화면이 사라진 파일을 불러오려다 나는 오류예요 (새로고침하면 해결돼요)
export const isChunkLoadError = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|Unable to preload CSS/i.test(
    String(error?.message ?? error ?? ''),
  )

// 잡히지 않은 오류 · 처리되지 않은 Promise 실패를 기록해요 (화면은 건드리지 않아요)
let installed = false
export const installGlobalErrorLogging = () => {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('error', (event) => reportClientError(event.error ?? event.message, { source: 'window.error' }))
  window.addEventListener('unhandledrejection', (event) => reportClientError(event.reason, { source: 'unhandledrejection' }))
}
