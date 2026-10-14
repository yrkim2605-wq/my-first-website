// 리뷰(모험 일지) 내용 글자 수 규칙이에요. 화면 · 로컬 저장소 · Supabase 저장소가 모두 이 규칙을 써요.
// 서버(0006_review_content.sql)도 같은 규칙으로 한 번 더 검사해서, 화면을 우회해도 짧은 일지는 저장되지 않아요.
//
//  - 최소: 공백(띄어쓰기 · 줄바꿈 · 탭 등)을 뺀 실제 글자가 20자 이상
//  - 최대: 앞뒤 공백을 뺀 전체가 500자 이하 (예전부터의 규칙 그대로예요)
//  - 글자 수는 "글자(코드 포인트)" 기준이라 이모지 하나도 1자예요 (서버의 char_length와 같아요)
//  - 이미 저장된 짧은 일지는 바꾸지 않아요. 새로 쓰거나 고칠 때만 이 규칙을 적용해요.

export const REVIEW_CONTENT_MIN = 20
export const REVIEW_CONTENT_MAX = 500

// 글자 수에서 빼는 공백: 띄어쓰기 · 탭 · 줄바꿈과, 눈에 안 보이는 공백 글자(NBSP, 전각 공백, 너비 0 공백 등)예요.
// 정규식 대신 글자 번호(유니코드)로 정확히 정해 둬서, 서버(0006_review_content.sql의 review_meaningful_length)와 똑같이 세요.
// ⚠️ 바꾸면 서버 SQL도 같이 바꾸고, supabase/tests/review-content.test.mjs의 "화면 = 서버" 일치 시험을 돌려요.
//   9~13(탭·줄바꿈 등), 32(띄어쓰기), 160(NBSP), 5760, 8192~8203(2000~200B), 8232, 8233, 8239, 8287, 12288(전각 공백), 65279(FEFF)
const isInvisibleSpace = (char) => {
  const code = char.codePointAt(0)
  return (
    (code >= 9 && code <= 13) ||
    code === 32 ||
    code === 160 ||
    code === 5760 ||
    (code >= 8192 && code <= 8203) ||
    code === 8232 ||
    code === 8233 ||
    code === 8239 ||
    code === 8287 ||
    code === 12288 ||
    code === 65279
  )
}

const countChars = (text) => Array.from(text).length

// 공백을 뺀 실제 글자 수
export const countMeaningfulChars = (text) => Array.from(String(text ?? '')).filter((char) => !isInvisibleSpace(char)).length

export const getShortContentMessage = (remaining) => `조금만 더 자세히 적어주세요! (${remaining}자 남음)`

// 입력창 아래 표시와 저장 버튼 잠금에 쓰는 상태
//  typedLength     : 입력창에 적힌 전체 글자 수 (예: 15/500의 15)
//  meaningfulLength: 공백을 뺀 글자 수 (최소 20자 판단 기준)
export const getReviewContentStatus = (text) => {
  const raw = String(text ?? '')
  const typedLength = countChars(raw)
  const meaningfulLength = countMeaningfulChars(raw)
  const trimmedLength = countChars(raw.trim())
  const remaining = Math.max(REVIEW_CONTENT_MIN - meaningfulLength, 0)
  const isTooShort = meaningfulLength < REVIEW_CONTENT_MIN
  const isTooLong = trimmedLength > REVIEW_CONTENT_MAX
  return { typedLength, meaningfulLength, trimmedLength, remaining, isTooShort, isTooLong, isValid: !isTooShort && !isTooLong }
}
