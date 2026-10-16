// 홈 장식(히어로 · 월드맵)과 새 스티커 점검 — 소스 + 이미지 파일 헤더로 확인해요 (실제 모양은 브라우저에서 따로 봤어요).
//  - 새로 자른 스티커 17종이 있고 투명 배경(알파)이에요
//  - 홈 장식에서 쓰는 스티커 이름이 모두 실제로 있고, 원본 가로보다 크게 늘려 쓰지 않아요 (늘리면 흐려져요)
//  - 장식은 Sticker(aria-hidden · 클릭 안 막음)로만 만들고, 폰에서는 숨기거나 줄여요
//  - 장식 때문에 body · html에 가로 넘침을 가리는 설정을 넣지 않았어요
// 실행: node supabase/tests/home-decor.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src')
const stickerDir = path.join(srcDir, 'assets/stickers')
const read = (file) => fs.readFileSync(path.join(srcDir, file), 'utf8').replace(/\r\n/g, '\n')

// WebP 헤더에서 가로 · 세로 · 알파 여부를 읽어요 (VP8X 확장 헤더 / VP8L 무손실)
const webpInfo = (file) => {
  const b = fs.readFileSync(file)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null
  const kind = b.toString('ascii', 12, 16)
  if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3), alpha: (b[20] & 0x10) !== 0 }
  if (kind === 'VP8L') { const bits = b.readUInt32LE(21); return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff), alpha: ((bits >> 28) & 1) === 1 } }
  return { width: 0, height: 0, alpha: false }
}

const NEW_STICKERS = ['barrel', 'lamp-post', 'chalkboard', 'camp-birdhouses', 'stall', 'sign-vines', 'sign-hanging', 'bubble-pin', 'bubble-heart', 'bubble-alert', 'bubble-question', 'bubble-music', 'plant-leaf', 'flower-white', 'flower-yellow', 'bush-flowers', 'bush-leafy']
const info = Object.fromEntries(fs.readdirSync(stickerDir).filter((f) => f.endsWith('.webp')).map((f) => [f.replace('.webp', ''), webpInfo(path.join(stickerDir, f))]))

check('새 스티커 17종이 모두 있어요', NEW_STICKERS.every((name) => info[name]), NEW_STICKERS.filter((n) => !info[n]).join(','))
check('새 스티커는 모두 올바른 WebP + 투명 배경(알파)이에요', NEW_STICKERS.every((name) => info[name]?.alpha && info[name].width > 0), NEW_STICKERS.filter((n) => !info[n]?.alpha).join(','))
check('기존 스티커 47종도 그대로예요 (총 64종)', Object.keys(info).length === 64, String(Object.keys(info).length))

const decorFiles = ['components/home/AdventureHero.jsx', 'components/home/BakeryMapHero.jsx']
const used = []
for (const file of decorFiles) {
  const text = read(file)
  for (const m of text.matchAll(/<Sticker name="([\w-]+)" width=\{(\d+)\}/g)) used.push({ file: path.basename(file), name: m[1], width: Number(m[2]) })
  for (const m of text.matchAll(/flank=\{\{ left: \{ name: '([\w-]+)', width: (\d+) \}, right: \{ name: '([\w-]+)', width: (\d+) \}/g)) {
    used.push({ file: path.basename(file), name: m[1], width: Number(m[2]) }, { file: path.basename(file), name: m[3], width: Number(m[4]) })
  }
}
check(`히어로 · 월드맵 장식 ${used.length}개가 쓰는 스티커가 모두 실제로 있어요`, used.length >= 10 && used.every((u) => info[u.name]), used.filter((u) => !info[u.name]).map((u) => u.name).join(','))
check('장식은 원본 가로보다 크게 늘리지 않아요 (흐려짐 방지)', used.every((u) => u.width <= info[u.name].width), used.filter((u) => u.width > info[u.name]?.width).map((u) => `${u.name} ${u.width}>${info[u.name].width}`).join(','))

const hero = read('components/home/AdventureHero.jsx')
const map = read('components/home/BakeryMapHero.jsx')
check('히어로: PC 장식은 lg 이상에서만, 폰 장식은 xs에서만 보여요 (그 사이는 글자와 겹치지 않게 뺌)', /DECOR_PC = \{[^}]*display: \{ xs: 'none', lg: 'block' \}/.test(hero) && /DECOR_PHONE = \{[^}]*display: \{ xs: 'block', sm: 'none' \}/.test(hero))
check('히어로: 360px 미만에서는 폰 장식도 숨겨요', /max-width:359px/.test(hero))
check('히어로: 장식은 글자 · 버튼 아래(zIndex 0), 내용은 위(zIndex 1)', /position: 'absolute', zIndex: 0/.test(hero) && /<Container maxWidth="lg" sx=\{\{ position: 'relative', zIndex: 1 \}\}>/.test(hero))
check('월드맵: 장식은 지도 프레임 뒤(zIndex 0)에, 프레임은 위(zIndex 1)라서 지도 버튼 · 로고를 가리지 않아요', /position: 'absolute', zIndex: 0/.test(map) && /\.\.\.PARCHMENT_SX, position: 'relative', zIndex: 1/.test(map))
check('월드맵: 폰 · 태블릿은 작은 덤불 1개만, 360px 미만은 숨겨요', /DECOR_SMALL = \{[^}]*lg: 'none'/.test(map) && /max-width:359px/.test(map))
check('지도 · 검색 · 카드 코드는 장식 때문에 바뀌지 않았어요 (BakeryMap 호출 그대로)', map.includes('<BakeryMap') && map.includes('regionRequest={regionRequest}') && map.includes('onSelectBakery={onSelectBakery}'))

const sticker = read('components/common/decor/Sticker.jsx')
check('Sticker는 장식용이에요: alt="" · aria-hidden · 클릭 안 막음', /alt=""/.test(sticker) && /aria-hidden="true"/.test(sticker) && /pointerEvents: 'none'/.test(sticker))

const hidden = []
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
for (const file of walk(srcDir).filter((f) => /\.(jsx?|css)$/.test(f))) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/overflow-x:\s*(hidden|clip)|overflowX:\s*'(hidden|clip)'/.test(line) && /body|html|#root/.test(line)) hidden.push(`${path.relative(srcDir, file)}:${i + 1}`)
  })
}
check('body · html에 가로 넘침을 가리는 설정이 없어요', hidden.length === 0, hidden.join(' / '))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
