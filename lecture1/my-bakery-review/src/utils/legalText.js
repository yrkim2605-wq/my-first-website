import { LEGAL_INFO, LEGAL_INFO_LABELS } from '../constants/legalInfo'

// 법률 문서의 한 문단을 조각으로 나눠요. 조각의 종류:
//   { type: 'text',    text }              일반 글자
//   { type: 'bold',    text }              **굵게**
//   { type: 'value',   text }              {키} → legalInfo.js에 값이 있어서 바뀐 글자
//   { type: 'pending', text, key, label }  {키} → 값이 비어 있어서 "[확인 필요: …]"로 보여줄 자리
// 알 수 없는 {키}는 값을 지어내지 않고 pending으로 취급해서 눈에 띄게 해요.
export const parseLegalText = (text, info = LEGAL_INFO) => {
  const parts = String(text).split(/(\{[A-Za-z]+\}|\*\*[^*]+\*\*)/g).filter((part) => part !== '')
  return parts.map((part) => {
    if (part.startsWith('**')) return { type: 'bold', text: part.slice(2, -2) }
    if (part.startsWith('{')) {
      const key = part.slice(1, -1)
      const value = String(info[key] ?? '').trim()
      if (value) return { type: 'value', text: value }
      return { type: 'pending', text: `[확인 필요: ${LEGAL_INFO_LABELS[key] ?? key}]`, key, label: LEGAL_INFO_LABELS[key] ?? key }
    }
    return { type: 'text', text: part }
  })
}

// 문서에서 쓰인 {키} 목록 (본문에 정의되지 않은 키가 없는지 시험할 때 써요)
export const collectLegalKeys = (doc) => {
  const keys = new Set()
  const scan = (text) => String(text).replace(/\{([A-Za-z]+)\}/g, (_, key) => keys.add(key))
  scan(doc.intro)
  doc.sections.forEach((section) => {
    scan(section.title)
    section.body.forEach((block) => (typeof block === 'string' ? scan(block) : block.list.forEach(scan)))
  })
  return [...keys]
}
