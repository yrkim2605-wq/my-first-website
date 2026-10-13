import { getBackendConfigProblem, IS_ACCOUNT_MODE } from './backend'

// Supabase 클라이언트는 "계정 모드"에서 처음 필요할 때만 불러와요 (로컬 모드는 코드도 내려받지 않아요).
// - 공개 가능한 URL + publishable 키만 사용해요. 비밀 키는 설정돼 있으면 연결 자체를 거부해요.
// - PKCE 방식: 메일 링크가 주소의 ?code= 로 돌아와서, 이 앱의 HashRouter(#/…)와 충돌하지 않아요.
let clientPromise = null

export const getSupabase = () => {
  if (!IS_ACCOUNT_MODE) return Promise.reject(new Error('계정 모드가 아니에요.'))
  const problem = getBackendConfigProblem()
  if (problem) return Promise.reject(new Error(problem))
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      }),
    )
  }
  return clientPromise
}

// 메일 링크가 돌아올 주소: 이 앱의 첫 화면 (개발 중에는 localhost, 배포 후에는 배포 주소)
// 대시보드의 Redirect URLs 허용 목록에 이 주소가 들어 있어야 해요.
export const getAuthRedirectUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`
