// 입력한 번호를 보기 좋게 하이픈으로 나눔 (뒤 4자리는 항상 마지막 묶음)
//  휴대전화 010-1234-5678 / 지역번호 051-714-0949, 02-123-4567 / 대표번호 1644-9879
export const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '').slice(0, 11)

  // 1588-1234 같은 대표번호는 0으로 시작하지 않음
  if (!digits.startsWith('0')) {
    return [digits.slice(0, 4), digits.slice(4, 8)].filter(Boolean).join('-')
  }

  // 서울(02)은 지역번호가 2자리라 번호가 최대 10자리
  const areaLength = digits.startsWith('02') ? 2 : 3
  if (areaLength === 2) digits = digits.slice(0, 10)

  const area = digits.slice(0, areaLength)
  const rest = digits.slice(areaLength)
  const parts = rest.length <= 4 ? [area, rest] : [area, rest.slice(0, -4), rest.slice(-4)]
  return parts.filter(Boolean).join('-')
}

// 하이픈 형식이 맞고 숫자가 8자리 이상이어야 함 (1644-9879 같은 대표번호부터 휴대전화까지)
export const isValidPhone = (value) => /^\d{2,4}-\d{3,4}(-\d{4})?$/.test(value) && value.replace(/\D/g, '').length >= 8
