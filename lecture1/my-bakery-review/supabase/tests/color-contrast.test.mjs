// 테마 글자색의 대비(WCAG AA: 일반 글자 4.5:1)를 계산으로 검증해요.
//  - 글자로 쓰는 색(본문 · 보조 · 와인 · 테라코타 · 진한 세이지 · 금색 글자 · 오류 빨강)이 크림 · 양피지 · 버터 바탕에서 모두 4.5:1 이상인지
//  - 색 바탕 위 글자(진한 테라코타 칩 + 크림 글자, 오류 빨강 버튼 + 흰 글자, 와인 띠 + 머스터드/크림, 세이지 블록 + 진한 갈색)
//  - 장식용 색(terracotta.main · gold.dark)은 글자로 쓰지 않는다는 점은 소스 검사로 확인해요 (아이콘 · 꽃 · 압정 · 경험치 바 전용)
// 양피지는 그라데이션이라 가장 어두운 가장자리(#E8D3A0)까지 최악 바탕으로 넣었어요.
// 실행: node supabase/tests/color-contrast.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(here, '../../src')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const mix = (fg, bg, alpha) => '#' + rgb(fg).map((v, i) => Math.round(v * alpha + rgb(bg)[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
const ratio = (a, b) => contrast(a, b).toFixed(2)

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
await server.close()
const p = theme.palette

const SURFACES = { 크림: p.background.default, 종이: p.background.paper, 양피지: '#F9EDCB', '양피지(밝은 끝)': '#FDF6E0', '양피지(어두운 끝)': '#E8D3A0', 버터: p.butter.main }
const AA = 4.5

// 1) 글자로 쓰는 색 × 모든 바탕
const TEXT_COLORS = {
  '본문(text.primary)': p.text.primary,
  '보조(text.secondary)': p.text.secondary,
  '와인(primary.main)': p.primary.main,
  '진한 테라코타(terracotta.dark)': p.terracotta.dark,
  '진한 세이지(secondary.dark)': p.secondary.dark,
  '금색 글자(gold.text)': p.gold.text,
  '오류 빨강(error.main)': p.error.main,
}
for (const [name, color] of Object.entries(TEXT_COLORS)) {
  const worst = Object.entries(SURFACES).map(([surface, bg]) => [surface, contrast(color, bg)]).sort((a, b) => a[1] - b[1])[0]
  check(`${name} ${color}: 모든 바탕에서 ${AA}:1 이상`, worst[1] >= AA, `가장 낮은 곳 ${worst[0]} ${worst[1].toFixed(2)}:1`)
}

// 2) 색 바탕 위 글자
check(`NEW 칩: 크림 글자 on 진한 테라코타 (${ratio(p.terracotta.contrastText, p.terracotta.dark)}:1)`, contrast(p.terracotta.contrastText, p.terracotta.dark) >= AA)
check(`오류 빨강 버튼: 흰 글자 on error.main (${ratio('#FFFFFF', p.error.main)}:1)`, contrast('#FFFFFF', p.error.main) >= AA)
check(`와인 안내 띠: 머스터드 링크 on 와인 (${ratio(p.mustard.main, p.primary.main)}:1)`, contrast(p.mustard.main, p.primary.main) >= AA)
check(`와인 띠 · 푸터: 크림 글자 on 와인 (${ratio(p.primary.contrastText, p.primary.main)}:1)`, contrast(p.primary.contrastText, p.primary.main) >= AA)
check(`푸터 저작권(크림 글자 투명도 0.8) on 와인 (${ratio(mix(p.primary.contrastText, p.primary.main, 0.8), p.primary.main)}:1)`, contrast(mix(p.primary.contrastText, p.primary.main, 0.8), p.primary.main) >= AA)
check(`세이지 블록: 진한 갈색(text.primary) on 세이지 (${ratio(p.text.primary, p.secondary.main)}:1)`, contrast(p.text.primary, p.secondary.main) >= AA)
check(`나무 판자: 금색(gold.light) on 나무 (${ratio(p.gold.light, p.wood.main)}:1)`, contrast(p.gold.light, p.wood.main) >= AA)

// 3) 장식용 색은 글자에 쓰지 않아요 (소스 검사): color: 'terracotta.main' / 'gold.dark' 로 글자 색을 정한 곳이 없어야 해요
{
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
  const files = walk(srcDir).filter((f) => f.endsWith('.jsx'))
  const bad = []
  for (const file of files) {
    fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n').forEach((line, i) => {
      // 아이콘(Icon) 색은 장식이라 제외하고, 글자(Typography · span · Box)의 color만 봐요
      if (/color: '(terracotta\.main|gold\.dark)'/.test(line) && !/Icon/.test(line)) bad.push(`${path.relative(srcDir, file)}:${i + 1}`)
    })
  }
  check('terracotta.main · gold.dark(장식용 색)를 글자 색으로 쓰는 곳이 없어요', bad.length === 0, bad.join(', '))
}

// 4) 세이지 블록 제목: onSage 톤이 있고, 홈 세이지 블록이 그 톤을 써요 (크림 글자 2.5:1 방지)
{
  const heading = fs.readFileSync(path.join(srcDir, 'components/common/SectionHeading.jsx'), 'utf8')
  const home = fs.readFileSync(path.join(srcDir, 'pages/Home.jsx'), 'utf8')
  check('SectionHeading에 세이지용 onSage 톤이 있어요', heading.includes("tone === 'onSage'"))
  check('홈의 세이지 블록(모험가의 기록) 제목이 onSage 톤이에요', /ADVENTURER'S LOG[\s\S]{0,200}tone="onSage"/.test(home))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
