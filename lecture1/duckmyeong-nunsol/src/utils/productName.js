// 상품명에서 모델명·규격 부분을 찾아 강조할 수 있게 조각으로 나눔 (상품명 자체는 바꾸지 않음)
//  모델명: 영문 대문자로 시작하고 하이픈이 들어간 코드 (PH-3515F, EJ-102N, CC-Link, CRYSTA-APEX V9106)
//  규격: 숫자 + 단위 (0.1μm, 0.1㎛, 360˚)
const MODEL_PATTERN = '[A-Z][A-Za-z]*(?:-[A-Za-z0-9]+)+(?: [A-Z]?\\d{2,}[A-Za-z0-9]*)?'
const SPEC_PATTERN = '\\d+(?:\\.\\d+)?\\s?(?:μm|㎛|mm|㎜|˚|°)'
const HIGHLIGHT_REGEX = new RegExp(`${MODEL_PATTERN}|${SPEC_PATTERN}`, 'g')

// "투영기 PH-3515F 정립상" → [{ text: '투영기 ', isHighlight: false }, { text: 'PH-3515F', isHighlight: true }, { text: ' 정립상', isHighlight: false }]
export const splitProductName = (name) => {
  const segments = []
  let lastIndex = 0
  for (const match of name.matchAll(HIGHLIGHT_REGEX)) {
    if (match.index > lastIndex) segments.push({ text: name.slice(lastIndex, match.index), isHighlight: false })
    segments.push({ text: match[0], isHighlight: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < name.length) segments.push({ text: name.slice(lastIndex), isHighlight: false })
  return segments
}
