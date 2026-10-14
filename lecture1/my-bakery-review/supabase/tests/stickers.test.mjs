// 꾸밈 스티커 점검: 코드에서 쓰는 스티커 이름이 src/assets/stickers/ 에 실제 파일로 있는지,
// 파일이 투명 배경 webp이고 너무 크지 않은지 확인해요 (이름을 잘못 쓰면 그림이 조용히 사라지기 때문이에요).
// 실행: node supabase/tests/stickers.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(here, '../../src')
const stickerDir = path.join(srcDir, 'assets/stickers')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const files = fs.readdirSync(stickerDir).filter((f) => f.endsWith('.webp'))
const names = new Set(files.map((f) => f.replace('.webp', '')))

// 1) 코드에 적힌 스티커 이름(따옴표 안의 knight-… · bread-… 같은 이름)이 모두 파일로 있어요
const PREFIX = ['knight-', 'bread-']
const SINGLE = ['levelup', 'crown', 'gem-ruby', 'gem-sapphire', 'medal-gold', 'medal-silver', 'medal-bronze', 'heart', 'sparkle', 'grass-strip', 'bush', 'bench', 'fence', 'signpost', 'flower', 'cloud', 'cloud-flower', 'flag', 'banner-lamp']
{
  const used = new Map()
  for (const file of walk(srcDir).filter((f) => f.endsWith('.jsx') && !f.endsWith('Sticker.jsx'))) {
    const text = fs.readFileSync(file, 'utf8')
    for (const quote of ["'", '"']) {
      for (const piece of text.split(quote)) {
        // 따옴표 사이 조각이 곧 이름인 경우만 (짧은 소문자-하이픈 문자열)
        if (piece.length > 30 || piece.length < 4) continue
        if (PREFIX.some((p) => piece.startsWith(p)) || SINGLE.includes(piece)) {
          // Sticker/flank/MOODS에서 쓰는 이름인지: 같은 파일에 Sticker 관련 단어가 있을 때만 셈
          if (/Sticker|flank|BreadRow|MOODS|AuthPanel/.test(text)) used.set(piece, path.relative(srcDir, file))
        }
      }
    }
  }
  const missing = [...used.entries()].filter(([name]) => !names.has(name)).map(([name, file]) => `${name} (${file})`)
  check(`코드에서 쓰는 스티커 이름 ${used.size}개가 모두 실제 파일로 있어요`, used.size >= 15 && missing.length === 0, missing.join(' / '))
}

// 2) 파일 점검: webp · 작은 용량
{
  const big = files.filter((f) => fs.statSync(path.join(stickerDir, f)).size > 40 * 1024)
  check('스티커 파일이 모두 webp이고 하나당 40KB 이하예요', files.length >= 40 && big.length === 0, big.join(', '))
  const total = files.reduce((sum, f) => sum + fs.statSync(path.join(stickerDir, f)).size, 0)
  check('스티커 전체 용량이 600KB 이하예요 (화면에 나올 때만 불러와요)', total <= 600 * 1024, `${Math.round(total / 1024)}KB`)
  const riff = files.filter((f) => {
    const head = fs.readFileSync(path.join(stickerDir, f)).subarray(0, 12).toString('latin1')
    return !(head.startsWith('RIFF') && head.endsWith('WEBP'))
  })
  check('모두 진짜 webp 파일이에요', riff.length === 0, riff.join(', '))
}

// 3) 컴포넌트: 꾸밈 그림은 화면 읽기 프로그램이 건너뛰고(aria-hidden · 빈 alt), 클릭을 막지 않아요
{
  const sticker = fs.readFileSync(path.join(srcDir, 'components/common/decor/Sticker.jsx'), 'utf8')
  check('Sticker: 빈 alt + aria-hidden + 클릭 막지 않음(pointer-events: none)', sticker.includes('alt=""') && sticker.includes('aria-hidden="true"') && sticker.includes("pointerEvents: 'none'"))
  check('Sticker: 움직임(float)은 기존 float-soft(움직임 줄이기 설정 존중)를 써요', sticker.includes("'float-soft'"))
}

// 4) 안내 상자(StatusMessage)를 쓰는 모든 곳에 상황(mood)이 정해져 있어요 (의도적으로 기본 마스코트를 쓰는 2곳 제외)
{
  const rows = []
  for (const file of walk(srcDir).filter((f) => f.endsWith('.jsx') && !f.endsWith('StatusMessage.jsx'))) {
    const text = fs.readFileSync(file, 'utf8')
    let pos = 0
    for (;;) {
      const i = text.indexOf('<StatusMessage', pos)
      if (i < 0) break
      const end = text.indexOf('/>', i)
      rows.push({ file: path.relative(srcDir, file), hasMood: text.slice(i, end).includes('mood='), segment: text.slice(i, end) })
      pos = end
    }
  }
  const noMood = rows.filter((r) => !r.hasMood)
  check(`안내 상자 ${rows.length}곳 중 mood 없는 곳은 의도한 2곳(권한 안내)뿐이에요`, rows.length >= 20 && noMood.length === 2 && noMood.every((r) => r.file.endsWith('CommunityPostForm.jsx')), noMood.map((r) => r.file).join(', '))
  const moods = new Set(rows.map((r) => r.segment.split('mood="')[1]?.split('"')[0]).filter(Boolean))
  check('쓰는 mood가 모두 StatusMessage에 정의돼 있어요', [...moods].every((m) => fs.readFileSync(path.join(srcDir, 'components/common/StatusMessage.jsx'), 'utf8').includes(`${m}:`)), [...moods].join(','))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
