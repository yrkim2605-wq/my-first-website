// 숫자만 남기고 010-1234-5678 / 051-123-4567 / 1644-9879 형태로 보기 좋게 맞춤
export const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.startsWith('02')) return digits.replace(/^(\d{2})(\d{3,4})(\d{0,4})$/, '$1-$2-$3').replace(/-$/, '')
  if (digits.length <= 8) return digits.replace(/^(\d{4})(\d{0,4})$/, '$1-$2').replace(/-$/, '')
  return digits.replace(/^(\d{3})(\d{3,4})(\d{0,4})$/, '$1-$2-$3').replace(/-$/, '')
}

// 하이픈 형식이 맞고 숫자가 8자리 이상이어야 함 (1644-9879 같은 대표번호부터 휴대전화까지)
export const isValidPhone = (value) => /^\d{2,4}-\d{3,4}(-\d{4})?$/.test(value) && value.replace(/\D/g, '').length >= 8
