// 홈의 검색창 두 개(히어로 아래 / 검색 결과 자리) 검증 — 서버 렌더링 + 소스 점검.
//  - 같은 컴포넌트를 variant만 달리해서 써요 (검색 로직 복제 없음). 두 곳이 같은 상태 · 같은 함수를 받아요.
//  - 히어로 쪽만 [결과 보기] 줄과 스크롤이 있고, 결과 쪽은 스크롤하지 않아요.
//  - 결과가 0개여도 결과 쪽 검색창 · 지역 필터는 그대로 있어요.
//  - 접근성: 두 검색창의 이름표(aria-label)가 서로 달라요.
// 화면에서의 실제 동기화 · 스크롤 · 포커스는 브라우저에서 따로 확인했어요.
// 실행: node supabase/tests/search-bar-sync.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { ThemeProvider } from '@mui/material/styles'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const clean = (html) => html.replace(/<!-- -->/g, '')
const count = (text, pattern) => (text.match(pattern) ?? []).length
// 칩 글자: '전체'와 모든 지역 이름이 칩 라벨로 들어 있는지
const hasAllChips = (html, districts) => ['전체', ...districts.map((d) => d.name)].every((name) => new RegExp(`MuiChip-label[^>]*>${name}<`).test(html))

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
const { default: BakerySearchBar } = await server.ssrLoadModule('/src/components/home/BakerySearchBar.jsx')
const { DISTRICTS } = await server.ssrLoadModule('/src/constants/districts.js')

const base = { searchQuery: '소금', onSearchChange: () => {}, selectedDistrictId: 'haeundae', onSelectDistrict: () => {}, resultCount: 3, onReset: () => {} }
const render = (props) => clean(renderToString(h(ThemeProvider, { theme }, h(BakerySearchBar, { ...base, ...props }))))

const hero = render({})
const results = render({ variant: 'results' })

check('두 검색창이 같은 검색어를 보여줘요', hero.includes('value="소금"') && results.includes('value="소금"'))
check('두 곳 모두 지역 칩(전체 + 모든 지역)을 보여줘요', hasAllChips(hero, DISTRICTS) && hasAllChips(results, DISTRICTS), `지역 ${DISTRICTS.map((d) => d.name).join(',')}`)
check('선택한 지역이 두 곳에서 같이 선택 표시돼요', count(hero, /MuiChip-filled/g) === 1 && count(results, /MuiChip-filled/g) === 1)
check('히어로 쪽만 "N곳을 찾았어요" · [결과 보기] · [초기화] 줄이 있어요', hero.includes('3곳을 찾았어요') && hero.includes('결과 보기') && hero.includes('초기화'))
check('결과 쪽에는 [결과 보기] 줄이 없어요 (이미 결과 자리라 스크롤하지 않아요)', !results.includes('결과 보기') && !results.includes('곳을 찾았어요'))
check('접근성: 두 검색창 · 지역 그룹 · 영역의 이름표가 서로 달라요', ['aria-label="빵집 이름이나 메뉴 검색"', 'aria-label="지역으로 빵집 거르기"', 'aria-label="빵집 찾기"'].every((a) => hero.includes(a)) && ['aria-label="빵집 이름이나 메뉴 다시 검색"', 'aria-label="지역으로 검색 결과 거르기"', 'aria-label="검색 결과에서 빵집 다시 찾기"'].every((a) => results.includes(a)))

const zero = render({ variant: 'results', searchQuery: '없는빵집', selectedDistrictId: null, resultCount: 0 })
check('결과가 0개여도 결과 쪽 검색창과 지역 필터가 그대로 보여요', zero.includes('<input') && hasAllChips(zero, DISTRICTS))
const loading = render({ variant: 'results', resultCount: null })
check('불러오는 중에도 결과 쪽 검색창은 그대로예요', loading.includes('<input'))

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src')
const home = fs.readFileSync(path.join(srcDir, 'pages/Home.jsx'), 'utf8').replace(/\r\n/g, '\n')
check('Home: 검색창 두 개가 같은 props 묶음(searchBarProps)을 써요', count(home, /<BakerySearchBar \{\.\.\.searchBarProps\}/g) === 2 && /variant="results"/.test(home))
check('Home: 검색 · 필터 상태와 함수는 하나뿐이에요 (복제 없음)', count(home, /const handleSearchChange = /g) === 1 && count(home, /const handleSelectDistrict = /g) === 1 && count(home, /const filteredBakeries = /g) === 1 && count(home, /useState\(''\)/g) === 1)
check('Home: 결과 쪽 검색창은 "전체 빵집" 영역 안(제목 아래)에 있어요', home.indexOf('id={ALL_BAKERIES_SECTION_ID}') < home.indexOf('variant="results"') && home.indexOf('variant="results"') < home.indexOf('visibleBakeries.map'))

const bar = fs.readFileSync(path.join(srcDir, 'components/home/BakerySearchBar.jsx'), 'utf8').replace(/\r\n/g, '\n')
check('결과 쪽 Enter는 스크롤하지 않고 키보드만 닫아요', /if \(isResults\) \{[\s\S]*?event\.target\.blur\(\)\n\s*return\n\s*\}/.test(bar))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
