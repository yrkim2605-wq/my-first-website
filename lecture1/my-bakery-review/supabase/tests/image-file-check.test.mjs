// 리뷰 사진 업로드 전 브라우저 점검(validateImageFile) 검증. 브라우저 없이 Node의 File로 시험해요.
//  - JPG · PNG · WebP만 통과 / GIF · HEIC · SVG · 사진이 아닌 파일은 거절
//  - 이름이나 형식 표시만 사진인 가짜 파일은 맨 앞 바이트(고유 표식)로 걸러요
//  - 10MB 넘는 파일 · 빈 파일 거절
// 실행: node supabase/tests/image-file-check.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { validateImageFile, sniffImageType, REVIEW_PHOTO_MAX_FILE_BYTES } = await server.ssrLoadModule('/src/utils/validateImageFile.js')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const bytes = (head, total = 64) => {
  const data = new Uint8Array(total)
  data.set(head)
  return data
}
const ascii = (text) => [...text].map((ch) => ch.charCodeAt(0))
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0])
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const WEBP = bytes([...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WEBP')])
const GIF = bytes(ascii('GIF89a'))
const PDF = bytes(ascii('%PDF-1.7'))
const file = (data, name, type) => new File([data], name, { type })

check('JPG 통과', (await validateImageFile(file(JPEG, 'a.jpg', 'image/jpeg'))).type === 'image/jpeg')
check('PNG 통과', (await validateImageFile(file(PNG, 'a.png', 'image/png'))).type === 'image/png')
check('WebP 통과', (await validateImageFile(file(WEBP, 'a.webp', 'image/webp'))).type === 'image/webp')
check('형식 표시가 비어 있어도 내용이 PNG면 통과', (await validateImageFile(file(PNG, 'noext', ''))).ok === true)
check('표시와 내용이 달라도(JPG 표시 · PNG 내용) 내용이 허용 형식이면 통과', (await validateImageFile(file(PNG, 'a.jpg', 'image/jpeg'))).type === 'image/png')

for (const [label, f, expectText] of [
  ['GIF', file(GIF, 'a.gif', 'image/gif'), 'GIF'],
  ['HEIC', file(bytes(ascii('....ftypheic')), 'a.heic', 'image/heic'), 'HEIC'],
  ['SVG', file(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'a.svg', 'image/svg+xml'), 'SVG'],
  ['사진이 아닌 문서(PDF, 형식 표시도 pdf)', file(PDF, 'a.pdf', 'application/pdf'), '사진이 아닌 파일'],
  ['이름과 형식 표시만 JPG인 문서 (내용은 PDF)', file(PDF, 'fake.jpg', 'image/jpeg'), '사진 파일이 아니거나'],
  ['이름만 PNG인 텍스트 (형식 표시 없음)', file(new TextEncoder().encode('hello'), 'fake.png', ''), '사진 파일이 아니거나'],
  ['GIF 표시인데 내용은 PNG', file(PNG, 'a.gif', 'image/gif'), 'GIF'],
]) {
  const result = await validateImageFile(f)
  check(`거절: ${label}`, result.ok === false && result.message.includes('JPG, PNG, WebP') && result.message.includes(expectText), JSON.stringify(result))
}

const empty = await validateImageFile(file(new Uint8Array(0), 'e.jpg', 'image/jpeg'))
check('거절: 빈 파일', empty.ok === false && empty.message.includes('비어'))
const justRight = await validateImageFile(file(bytes([0xff, 0xd8, 0xff], REVIEW_PHOTO_MAX_FILE_BYTES), 'big.jpg', 'image/jpeg'))
check('정확히 10MB는 통과', justRight.ok === true)
const tooBig = await validateImageFile(file(bytes([0xff, 0xd8, 0xff], REVIEW_PHOTO_MAX_FILE_BYTES + 1), 'big.jpg', 'image/jpeg'))
check('10MB를 넘으면 거절 + 현재 크기와 한도 안내', tooBig.ok === false && tooBig.message.includes('10.0MB') && tooBig.message.includes('10MB'), tooBig.message)
check('거절: 파일을 안 골랐을 때', (await validateImageFile(null)).ok === false && (await validateImageFile(undefined)).ok === false)
check('sniffImageType: 모르는 내용은 null', (await sniffImageType(file(PDF, 'a.pdf', ''))) === null && (await sniffImageType(null)) === null)

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
