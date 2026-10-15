// 개인정보처리방침 · 이용약관 초안 점검: 운영자 정보를 임의로 채우지 않았는지, 본문의 {키}가 모두 정의돼 있는지, 문서가 서비스의 실제 기능과 어긋나지 않는지.
// 실행: node supabase/tests/legal-docs.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const load = (file) => server.ssrLoadModule(file)
const { LEGAL_INFO, LEGAL_INFO_LABELS, LEGAL_VERSION, getPendingLegalKeys } = await load('/src/constants/legalInfo.js')
const { PRIVACY_POLICY, TERMS_OF_SERVICE } = await load('/src/constants/legalDocs.js')
const { parseLegalText, collectLegalKeys } = await load('/src/utils/legalText.js')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const docs = { 개인정보처리방침: PRIVACY_POLICY, 이용약관: TERMS_OF_SERVICE }
const allText = JSON.stringify(docs)

// ── 임의로 채우지 않았는지 ──
const CONFIRMED_LEGAL_KEYS = ['operatorName', 'contactEmail', 'privacyOfficer', 'effectiveDate', 'dataRegion', 'mailProvider', 'logRetention', 'mailLogRetention', 'mailProviderRegion', 'minimumAge', 'reportRetention', 'backupRetention']
check('운영자가 확정한 값은 채워져 있어요', CONFIRMED_LEGAL_KEYS.every((key) => String(LEGAL_INFO[key]).trim() !== ''), JSON.stringify(getPendingLegalKeys()))
check('아직 확정하지 않은 값은 비어 있어요 (임의로 채우지 않아요)', Object.keys(LEGAL_INFO_LABELS).filter((key) => !CONFIRMED_LEGAL_KEYS.includes(key)).every((key) => LEGAL_INFO[key] === ''), JSON.stringify(getPendingLegalKeys()))
check('확인 필요 항목 목록은 확정하지 않은 값만 남아요', getPendingLegalKeys().length === Object.keys(LEGAL_INFO_LABELS).length - CONFIRMED_LEGAL_KEYS.length)
check('문서 버전이 있어요', typeof LEGAL_VERSION === 'string' && LEGAL_VERSION.length > 0)
check('본문에 이메일 주소 · 전화번호 · 사업자번호처럼 보이는 값이 들어 있지 않아요', !/[\w.-]+@[\w-]+\.[a-z]{2,}/i.test(allText.replace(/privacy\.kisa\.or\.kr/g, '')) && !/\d{2,3}-\d{3,4}-\d{4}/.test(allText) && !/\d{3}-\d{2}-\d{5}/.test(allText))

// ── {키} 점검 ──
for (const [name, doc] of Object.entries(docs)) {
  const keys = collectLegalKeys(doc)
  check(`${name}: 본문의 {키}가 모두 legalInfo에 정의돼 있어요`, keys.every((key) => key in LEGAL_INFO), keys.filter((key) => !(key in LEGAL_INFO)).join(','))
}
check('두 문서가 확인 필요 항목을 모두 합쳐서 빠짐없이 쓰고 있어요', Object.keys(LEGAL_INFO_LABELS).every((key) => [PRIVACY_POLICY, TERMS_OF_SERVICE].some((doc) => collectLegalKeys(doc).includes(key))), Object.keys(LEGAL_INFO_LABELS).filter((key) => ![PRIVACY_POLICY, TERMS_OF_SERVICE].some((doc) => collectLegalKeys(doc).includes(key))).join(','))

// ── 글 조각 만들기 ──
{
  const pieces = parseLegalText('문의: {contactEmail} / **굵게** / 일반', { contactEmail: '' })
  check('빈 값은 "[확인 필요: …]" 조각으로 나와요', pieces.some((piece) => piece.type === 'pending' && piece.text === '[확인 필요: 문의 이메일]'))
  check('**굵게**는 bold 조각', pieces.some((piece) => piece.type === 'bold' && piece.text === '굵게'))
}
{
  const pieces = parseLegalText('문의: {contactEmail}', { contactEmail: 'help@example.test' })
  check('값이 있으면 그 값으로 바뀌어요', pieces.some((piece) => piece.type === 'value' && piece.text === 'help@example.test') && !pieces.some((piece) => piece.type === 'pending'))
}
{
  const pieces = parseLegalText('{unknownKey}', {})
  check('알 수 없는 {키}는 값을 지어내지 않고 확인 필요로 나와요', pieces[0].type === 'pending' && pieces[0].text.includes('unknownKey'))
}

// ── 서비스의 실제 기능과 맞는지 (문서가 없는 기능을 약속하지 않도록) ──
const privacy = JSON.stringify(PRIVACY_POLICY)
check('방침에 수집 항목(이메일 · 닉네임 · 비밀번호 · 사진)이 있어요', ['이메일', '닉네임', '비밀번호', '사진'].every((word) => privacy.includes(word)))
check('방침에 위탁 업체(Supabase · 카카오 · GitHub Pages)와 국외 이전이 있어요', ['Supabase', '카카오', 'GitHub Pages', '국외'].every((word) => privacy.includes(word)))
check('방침에 공개되는 정보 안내가 있어요 (로그인하지 않은 방문자 포함)', privacy.includes('누구에게나 공개'))
check('방침에 탈퇴 시 삭제 안내가 있어요', privacy.includes('회원 탈퇴 시 바로 삭제'))
check('방침에 이용자 권리 · 책임자 · 문의처가 있어요', ['열람', '보호책임자', '문의 이메일'].every((word) => privacy.includes(word)))
check('방침은 위치 정보를 수집하지 않는다고 밝혀요 (코드에 geolocation 없음)', privacy.includes('위치 정보를 수집하지 않아요'))
const terms = JSON.stringify(TERMS_OF_SERVICE)
check('약관에 베타 · 금지행위 · 게시물 권리 · 신고 · 탈퇴 조항이 있어요', ['베타', '금지 행위', '게시물의 권리', '신고', '회원 탈퇴'].every((word) => terms.includes(word)))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
