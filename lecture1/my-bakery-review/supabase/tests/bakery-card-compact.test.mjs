// 홈 "전체 빵집"의 폰용 가로형 컴팩트 카드(compactMobile) 구조 검증 — 서버 렌더링 + 소스 점검 (CSS 배치는 브라우저에서 따로 봐요).
//  - 옵션을 안 켠 카드(퀘스트 · 도감 등)는 기존과 같은 구조: 링크 1개 · 찜 버튼 1개
//  - 옵션을 켠 카드: 링크 1개(카드 전체 클릭) · 찜 버튼 2개(사진 위 / 평점 줄 옆, 폰과 PC 중 한쪽만 보여요) · 정보는 그대로
//  - 두 찜 버튼은 같은 처리(handleBookmarkClick: 이동 막기 + 찜 토글)를 써서 클릭이 충돌하지 않아요
// 실행: node supabase/tests/bakery-card-compact.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const clean = (html) => html.replace(/<!-- -->/g, '')
const count = (html, pattern) => (html.match(pattern) ?? []).length

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
const { BookmarksContext, RealBakeryPhotosContext } = await server.ssrLoadModule('/src/context/contexts.js')
const { default: BakeryStageCard } = await server.ssrLoadModule('/src/components/common/BakeryStageCard.jsx')
const { default: BakeryCardSkeleton } = await server.ssrLoadModule('/src/components/common/BakeryCardSkeleton.jsx')

const render = (props, bookmarked = false) =>
  clean(
    renderToString(
      h(
        ThemeProvider,
        { theme },
        h(
          MemoryRouter,
          null,
          h(
            BookmarksContext.Provider,
            { value: { isBookmarked: () => bookmarked, toggleBookmark: () => {} } },
            h(RealBakeryPhotosContext.Provider, { value: { photosByBakeryId: {} } }, h(BakeryStageCard, props)),
          ),
        ),
      ),
    ),
  )

const base = { id: '8010849', name: '옵스 해운대점', districtLabel: '해운대', signatureMenu: '케이크', reviewCount: 0, tags: ['케이크', '디저트'], heartCount: 0 }

const normal = render(base)
check('기본 카드: 카드 링크 1개(빵집 상세로 이동)', count(normal, /href="\/bakery\/8010849"/g) === 1)
check('기본 카드: 찜 버튼 1개 (기존 구조 그대로)', count(normal, /aria-label="옵스 해운대점 찜하기"/g) === 1)

const compact = render({ ...base, compactMobile: true })
check('컴팩트 카드: 카드 링크 1개 (카드 전체를 누르면 상세로 가요)', count(compact, /href="\/bakery\/8010849"/g) === 1)
check('컴팩트 카드: 찜 버튼 2개 (사진 위 / 평점 줄 옆. CSS로 한 곳만 보여요)', count(compact, /aria-label="옵스 해운대점 찜하기"/g) === 2)
check('컴팩트 카드: 이름 · 지역 · 대표 메뉴 · 리뷰 안내가 그대로 있어요', ['옵스 해운대점', '해운대', '대표 메뉴 · 케이크', '아직 리뷰가 없어요'].every((text) => compact.includes(text)))
check('컴팩트 카드: 사진 자리(플레이스홀더)도 그대로 — 사진 정책 유지', compact.includes('첫 번째 빵 사진을 기다리고 있어요!') && /illust-knight-(camera|map|magnifier|book)/.test(compact))
check('컴팩트 카드: 태그는 DOM에 있고 폰에서만 CSS로 숨겨요', compact.includes('디저트'))

const marked = render({ ...base, compactMobile: true }, true)
check('찜한 빵집: 두 찜 버튼 모두 "찜 해제" 상태로 같이 바뀌어요', count(marked, /aria-label="옵스 해운대점 찜 해제"/g) === 2 && count(marked, /aria-pressed="true"/g) === 2)

const withReviews = render({ ...base, compactMobile: true, rating: 4.5, reviewCount: 12, heartCount: 3, ratingStatus: 'ready' })
check('리뷰가 있는 컴팩트 카드: 별점 · 리뷰 수 · 하트 수가 그대로 있어요', withReviews.includes('4.5') && withReviews.includes('>12<') && withReviews.includes('>3<'))

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src')
const source = fs.readFileSync(path.join(srcDir, 'components/common/BakeryStageCard.jsx'), 'utf8').replace(/\r\n/g, '\n')
check('두 찜 버튼은 한 곳에서 만들어서 같은 클릭 처리(이동 막기 + 토글)를 써요', count(source, /onClick=\{handleBookmarkClick\}/g) === 1 && /event\.preventDefault\(\)\s*\n\s*event\.stopPropagation\(\)/.test(source))
check('옵션은 기본 꺼짐이라 퀘스트 · 도감 · 다른 화면의 카드는 바뀌지 않아요', /compactMobile = false/.test(source))

const homeSource = fs.readFileSync(path.join(srcDir, 'pages/Home.jsx'), 'utf8').replace(/\r\n/g, '\n')
check('홈에서는 "전체 빵집" 목록(카드 · 스켈레톤)에만 옵션을 켜요', count(homeSource, /compactMobile/g) === 2)
check('스켈레톤도 기본 모양은 그대로 렌더링돼요 (오류 없음)', renderToString(h(BakeryCardSkeleton)).includes('MuiSkeleton') && renderToString(h(BakeryCardSkeleton, { compactMobile: true })).includes('MuiSkeleton'))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
