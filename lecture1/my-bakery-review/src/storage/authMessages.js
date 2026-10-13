import { RepositoryError } from './localStore'

// Supabase 인증 오류를 사용자가 이해할 수 있는 한국어 안내로 바꿔요.
// 오류 종류(code)는 화면이 분기할 때도 써요 (예: EMAIL_NOT_CONFIRMED → 인증 메일 재발송 안내).

export const AUTH_NETWORK_MESSAGE = '서버에 연결하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요. (아무것도 저장되지 않았어요)'

const BY_CODE = {
  invalid_credentials: ['INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않아요.'],
  email_not_confirmed: ['EMAIL_NOT_CONFIRMED', '아직 이메일 인증을 마치지 않았어요. 받은 메일의 인증 링크를 눌러 주세요.'],
  user_already_exists: ['EMAIL_TAKEN', '이미 가입된 이메일이에요. 로그인해 주세요.'],
  email_exists: ['EMAIL_TAKEN', '이미 가입된 이메일이에요. 로그인해 주세요.'],
  weak_password: ['WEAK_PASSWORD', '비밀번호가 너무 약해요. 8자 이상, 쉬운 단어나 숫자 나열은 피해 주세요.'],
  email_address_invalid: ['INVALID_EMAIL', '사용할 수 없는 이메일 주소예요. 다른 이메일로 시도해 주세요.'],
  validation_failed: ['INVALID_INPUT', '입력한 내용을 다시 확인해 주세요.'],
  signup_disabled: ['SIGNUP_DISABLED', '지금은 새로 가입할 수 없어요.'],
  over_email_send_rate_limit: ['EMAIL_RATE_LIMIT', '인증 메일을 너무 자주 요청했어요. 잠시 후 다시 시도해 주세요.'],
  over_request_rate_limit: ['REQUEST_RATE_LIMIT', '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'],
  otp_expired: ['LINK_EXPIRED', '인증 링크가 만료되었거나 이미 사용됐어요. 인증 메일을 다시 받아 주세요.'],
  flow_state_not_found: ['LINK_EXPIRED', '인증 링크가 만료되었거나 이미 사용됐어요. 인증 메일을 다시 받아 주세요.'],
  user_banned: ['USER_BANNED', '이용이 제한된 계정이에요.'],
}

const looksLikeNetworkError = (error) =>
  error?.name === 'AuthRetryableFetchError' ||
  error instanceof TypeError ||
  /failed to fetch|networkerror|load failed|network request failed/i.test(String(error?.message ?? ''))

// error: supabase-js의 오류 객체 (또는 임의의 Error)
export const toAuthError = (error) => {
  if (error instanceof RepositoryError) return error
  if (looksLikeNetworkError(error)) return new RepositoryError('NETWORK', AUTH_NETWORK_MESSAGE)

  const mapped = BY_CODE[error?.code]
  if (mapped) return new RepositoryError(mapped[0], mapped[1])

  // 가입 중 DB 트리거가 닉네임 때문에 실패하면 이런 문구로 와요 (닉네임 중복 경쟁 상태 등)
  if (/database error saving new user/i.test(String(error?.message ?? ''))) {
    return new RepositoryError('NICKNAME_UNAVAILABLE', '이 닉네임은 사용할 수 없어요. 다른 닉네임으로 시도해 주세요.')
  }
  if (/rate limit/i.test(String(error?.message ?? '')) || error?.status === 429) {
    return new RepositoryError('REQUEST_RATE_LIMIT', '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.')
  }
  if (/email not confirmed/i.test(String(error?.message ?? ''))) {
    return new RepositoryError('EMAIL_NOT_CONFIRMED', BY_CODE.email_not_confirmed[1])
  }
  if (/invalid login credentials/i.test(String(error?.message ?? ''))) {
    return new RepositoryError('INVALID_CREDENTIALS', BY_CODE.invalid_credentials[1])
  }
  return new RepositoryError('UNKNOWN', '문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
}

// 메일 링크가 오류와 함께 돌아왔을 때(주소의 #error_code=…) 보여줄 안내
export const messageForCallbackError = (errorCode) => {
  const mapped = BY_CODE[errorCode]
  return mapped ? mapped[1] : '이메일 인증 링크를 처리하지 못했어요. 인증 메일을 다시 받아 주세요.'
}
