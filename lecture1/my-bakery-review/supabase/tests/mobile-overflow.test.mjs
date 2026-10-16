// 폰에서 페이지가 가로로 넘치던 원인이 되살아나지 않는지 소스로 점검해요 (실제 폭 측정은 브라우저에서 따로 했어요).
//  - 홈의 전체 폭 박스가 100vw를 쓰지 않아요 (세로 스크롤바가 있는 화면에서 스크롤바 폭만큼 가로로 넘쳤어요)
//  - 길드의 레벨 5칸 줄은 minmax(0, 1fr)이라 글자 · 메달의 최소 너비 때문에 화면보다 넓어지지 않아요 (320px에서 47px 넘쳤어요)
//  - 헤더의 숨은 드롭다운은 폰에서 화면 안쪽(left 16px) 기준이에요 (가운데 정렬이면 오른쪽 밖으로 나가요)
//  - 가로 넘침을 body overflow-x: hidden 같은 것으로 가리지 않았어요
// 실행: node supabase/tests/mobile-overflow.test.mjs

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
const read = (file) => fs.readFileSync(path.join(srcDir, file), 'utf8').replace(/\r\n/g, '\n')
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

const home = read('pages/Home.jsx')
check('홈: 전체 폭 박스가 100vw를 쓰지 않아요', !/width: '100vw'/.test(home) && /const FULL_BLEED_SX = \{\n  width: '100%',\n\}/.test(home))
check('홈: 100vw 때문에 필요했던 좌우 당기기(left 50% · 음수 margin)도 없어요', !/marginLeft: '-50vw'/.test(home))

const guild = read('components/home/LevelUpTeaser.jsx')
check("길드: 레벨 5칸 줄은 폰에서 minmax(0, 1fr)", /gridTemplateColumns: \{ xs: 'repeat\(5, minmax\(0, 1fr\)\)', sm: 'repeat\(5, 1fr\)' \}/.test(guild))
check('길드: PC 메달 크기(74px)는 그대로예요', /width: \{ xs: '100%', sm: 74 \}/.test(guild))
check('길드: 설명 문구 · 단계별 EXP 기준 글자는 폰에서만 숨겨요 (sm 이상은 보여요)', (guild.match(/display: \{ xs: 'none', sm: 'block' \}/g) ?? []).length === 2)
check('길드: 진행 막대 · 현재 레벨 · 마이페이지 버튼이 그대로 있어요', ['XpProgressBar', 'to="/mypage"', '내 레벨과 메달 보기', "isCurrent && ("].every((text) => guild.includes(text)))

const header = read('components/layout/Header.jsx')
check('헤더: 드롭다운은 폰에서 화면 안쪽 기준 (left 16 · 항목 position static), PC는 가운데 정렬 그대로', /left: \{ xs: 16, md: '50%' \}/.test(header) && /position: \{ xs: 'static', md: 'relative' \}/.test(header) && /md: 'translate\(-50%, 0\)'/.test(header))

const hidden = []
for (const file of walk(srcDir).filter((f) => /\.(jsx?|css)$/.test(f))) {
  read(path.relative(srcDir, file)).split('\n').forEach((line, i) => {
    if (/overflow-x:\s*(hidden|clip)|overflowX:\s*'(hidden|clip)'/.test(line) && /body|html|#root/.test(line)) hidden.push(`${path.relative(srcDir, file)}:${i + 1}`)
  })
}
check('body · html에 overflow-x: hidden으로 넘침을 가리지 않았어요', hidden.length === 0, hidden.join(' / '))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
