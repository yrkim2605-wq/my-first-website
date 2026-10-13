// 데이터를 어디에 저장하는지 정하는 스위치예요.
//   VITE_DATA_BACKEND=local     (기본) 이 브라우저(localStorage)에만 저장. 지금까지와 똑같이 동작해요.
//   VITE_DATA_BACKEND=supabase  계정(Supabase)으로 로그인. 연결이 안 되면 로컬에 몰래 저장하지 않고 오류를 보여줘요.
//
// ⚠️ 환경변수만 바꾼다고 기존 기록이 옮겨지지는 않아요. 로컬 기록은 지우지 않고 그대로 남아 있고,
//    Supabase로 옮기는 일은 별도 절차(이전 화면)로 해요.

export const DATA_BACKEND = import.meta.env.VITE_DATA_BACKEND === 'supabase' ? 'supabase' : 'local'
export const IS_ACCOUNT_MODE = DATA_BACKEND === 'supabase'

// 계정 모드 설정이 올바른지 살펴봐요. 문제가 있으면 한국어 설명을 돌려주고, 없으면 null이에요.
export const getBackendConfigProblem = () => {
  if (!IS_ACCOUNT_MODE) return null
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return '계정 모드인데 Supabase 설정(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)이 없어요. .env를 확인한 뒤 개발 서버를 다시 시작해 주세요.'
  }
  if (isSecretKey(key)) {
    return '비밀 키가 설정되어 있어서 연결하지 않았어요. 브라우저에는 publishable 키(sb_publishable_…)만 써야 해요. 대시보드에서 노출된 비밀 키를 재발급해 주세요.'
  }
  return null
}

// 비밀 키(sb_secret_…, service_role)가 브라우저 설정에 들어가 있지는 않은지 확인해요.
export const isSecretKey = (key) => {
  if (String(key).startsWith('sb_secret_')) return true
  try {
    const payload = JSON.parse(atob(String(key).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}
