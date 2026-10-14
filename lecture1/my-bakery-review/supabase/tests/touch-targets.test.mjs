// 모바일 터치 영역(최소 44px) 검증.
//  - 소스에서 44px 미만으로 정한 버튼 · 링크 높이가 남아 있지 않은지 (글자만 있는 안내 줄은 제외)
//  - 테마: 터치 기기(pointer: coarse)에서는 모든 MUI 버튼이 44px 이상
//  - 수정 · 삭제 · 답글 달기 · 사진 빼기 같은 작은 글자 버튼, 좋아요 버튼
// 실행: node supabase/tests/touch-targets.test.mjs

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

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const files = walk(srcDir).filter((f) => f.endsWith('.jsx'))
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

// 1) 소스에 남은 44px 미만 높이 (BakeryStageCard의 24는 글자 줄 높이라 버튼이 아니에요)
{
  const small = []
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      for (const match of line.matchAll(/minHeight: (\d+)[,} ]/g)) {
        const value = Number(match[1])
        if (value < 44 && !/Typography|<Box sx=\{\{ display: 'flex', alignItems: 'center', gap: 1\.5, minHeight: 24/.test(line)) small.push(`${path.relative(srcDir, file)}:${i + 1} minHeight ${value}`)
      }
    })
  }
  check('버튼 · 링크 높이를 44px 미만으로 정한 곳이 없어요', small.length === 0, small.join(' / '))
}

// 2) 수정 · 삭제 · 답글 달기 등 글자 버튼 (실제 글 상세 + 예시 글 상세)
{
  const account = read(path.join(srcDir, 'pages/AccountPostDetail.jsx'))
  check('계정 모드 글 상세: 수정 · 삭제 · 답글 달기 버튼 높이 44px + 최소 너비 44px', /const TEXT_BUTTON_SX = \{ minWidth: 44, minHeight: 44,/.test(account))
  check('계정 모드 글 상세: 글 수정 · 글 삭제 · 댓글 삭제 · 답글 달기가 모두 이 공통 스타일을 써요', ['글 수정', '글 삭제'].every((label) => account.includes(label)) && (account.match(/sx=\{TEXT_BUTTON_SX\}/g) ?? []).length >= 4)
  const sample = read(path.join(srcDir, 'pages/CommunityPostDetail.jsx'))
  check('예시 글 상세(로컬 모드): 수정 · 삭제 · 답글 달기 · 좋아요/싫어요 버튼도 44px', !/minHeight: (36|40)/.test(sample) && (sample.match(/minHeight: 44/g) ?? []).length >= 7)
  check('리뷰 카드 수정 · 삭제, 내 일지 목록 버튼/링크, 사진 빼기도 44px', ['components/bakery/ReviewJournalCard.jsx', 'components/mypage/MyLogList.jsx', 'components/bakery/ReviewDialog.jsx'].every((f) => !/minHeight: (36|40)/.test(read(path.join(srcDir, f)))))
  check('맨 위 가입 배너 링크도 44px', /minHeight: 44,/.test(read(path.join(srcDir, 'components/layout/Layout.jsx'))))
  const picker = read(path.join(srcDir, 'components/community/PostPhotoPicker.jsx'))
  check('새로 만든 사진 버튼 · 업로드 실패 선택 버튼 · 더 보기 버튼도 44px 이상', (picker.match(/minHeight: 44/g) ?? []).length >= 2 && /minHeight: 44/.test(read(path.join(srcDir, 'components/community/PhotoUploadFailedNotice.jsx'))) && /minHeight: 48/.test(read(path.join(srcDir, 'components/common/LoadMoreFooter.jsx'))))
}

// 3) 테마: 터치 기기에서 모든 MUI 버튼 44px (작은 버튼 포함), 나무 간판 버튼(작은 크기)도 44px
{
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  const { default: theme } = await server.ssrLoadModule('/src/theme.js')
  const root = theme.components.MuiButton.styleOverrides.root
  check('테마: 터치 기기(pointer: coarse)에서 MUI 버튼 최소 높이 · 너비 44px', root['@media (pointer: coarse)']?.minHeight === 44 && root['@media (pointer: coarse)']?.minWidth === 44, JSON.stringify(root['@media (pointer: coarse)']))
  check('테마: 마우스 기기에서는 기존 크기(40px) 그대로 — 데스크톱 모양은 바뀌지 않아요', root.minHeight === 40)
  await server.close()
  check('나무 간판 버튼(작은 크기)도 터치 기기에서 44px', /'@media \(pointer: coarse\)': \{ minHeight: 44 \}/.test(read(path.join(srcDir, 'components/common/WoodButton.jsx'))))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
