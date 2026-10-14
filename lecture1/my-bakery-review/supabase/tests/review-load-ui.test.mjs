// 내 기록 "불러오는 중 / 불러오기 실패" 표시 검증 (브라우저 없이 서버 렌더링으로 화면 문구를 확인해요).
//  - 판단 로직(getReviewLoadStatus)과, 이 값을 쓰는 화면(헤더 배지 · 내 모험가 · 내 기록 카드 · 홈 길드 카드 · 리뷰 작성창)을 확인해요.
//  - 계정 모드에서 로그인한 상태에서만 안내가 나오고, 로컬 모드 · 로그아웃은 예전 그대로예요.
// 실행: node supabase/tests/review-load-ui.test.mjs

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

const accountEnv = {
  'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('supabase'),
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fake.supabase.test'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fake_for_ui_test'),
}
const makeServer = (define) => createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', define })

// ── 1. 판단 로직 ──
{
  const server = await makeServer(accountEnv)
  const { getReviewLoadStatus } = await server.ssrLoadModule('/src/utils/reviewLoadStatus.js')
  const base = { isAccountMode: true, userId: 'u1', loaded: true, loadedUserId: 'u1', loadError: null }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  check('로컬 모드는 항상 안내 없음', eq(getReviewLoadStatus({ ...base, isAccountMode: false, loaded: false }), { isLoading: false, loadError: null }))
  check('로그아웃(계정 모드)은 안내 없음', eq(getReviewLoadStatus({ ...base, userId: null, loaded: false }), { isLoading: false, loadError: null }))
  check('처음 불러오는 중', getReviewLoadStatus({ ...base, loaded: false, loadedUserId: undefined }).isLoading === true)
  check('다른 계정으로 바뀐 직후엔 다시 불러오는 중', getReviewLoadStatus({ ...base, loadedUserId: 'old-user' }).isLoading === true)
  check('불러오기 완료 → 안내 없음', eq(getReviewLoadStatus(base), { isLoading: false, loadError: null }))
  check('불러오기 실패 → 오류 문구', eq(getReviewLoadStatus({ ...base, loadError: '서버 오류' }), { isLoading: false, loadError: '서버 오류' }))
  check('불러오는 중에는 이전 실패 문구를 보여주지 않아요', getReviewLoadStatus({ ...base, loaded: false, loadedUserId: undefined, loadError: '이전 오류' }).loadError === null)
  await server.close()
}

// ── 2. 화면 문구 (서버 렌더링) ──
const renderIn = async (server, componentPath, context) => {
  const { default: theme } = await server.ssrLoadModule('/src/theme.js')
  const { ProfileContext, ReviewsContext } = await server.ssrLoadModule('/src/context/contexts.js')
  const { BusanBakeriesProvider } = await server.ssrLoadModule('/src/context/BusanBakeriesContext.jsx')
  const { VisitedBakeriesProvider } = await server.ssrLoadModule('/src/context/VisitedBakeriesContext.jsx')
  const { RealBakeryPhotosProvider } = await server.ssrLoadModule('/src/context/RealBakeryPhotosContext.jsx')
  const { default: Component } = await server.ssrLoadModule(componentPath)
  const reviewsValue = { reviews: [], levelsByUserId: null, gameSettings: null, reload: () => {}, ...context.reviews }
  // React 서버 렌더링은 붙어 있는 글자 사이에 <!-- --> 표식을 넣어요 ("Lv.<!-- -->1") → 지우고 비교해요
  const html = renderToString(
    h(ThemeProvider, { theme }, h(MemoryRouter, null, h(ProfileContext.Provider, { value: { profile: context.profile, ready: true } }, h(ReviewsContext.Provider, { value: reviewsValue }, h(BusanBakeriesProvider, null, h(VisitedBakeriesProvider, null, h(RealBakeryPhotosProvider, null, h(Component, context.props)))))))),
  )
  return html.replace(/<!-- -->/g, '')
}
const ME = { userId: 'u1', nickname: '테스트모험가', createdAt: '2026-10-14T00:00:00Z', email: 'ui@test.dev' }
const states = {
  loading: { profile: ME, reviews: { loaded: false, loadedUserId: undefined, loadError: null } },
  switched: { profile: ME, reviews: { loaded: true, loadedUserId: 'someone-else', loadError: null } },
  failed: { profile: ME, reviews: { loaded: true, loadedUserId: 'u1', loadError: '서버에 연결하지 못했어요.' } },
  ok: { profile: ME, reviews: { loaded: true, loadedUserId: 'u1', loadError: null } },
  loggedOut: { profile: null, reviews: { loaded: false, loadedUserId: undefined, loadError: null } },
}

{
  const server = await makeServer(accountEnv)
  const badge = '/src/components/layout/HeaderLevelBadge.jsx'
  const record = '/src/components/ranking/MyRecordCard.jsx'
  const teaser = '/src/components/home/LevelUpTeaser.jsx'
  const myPage = '/src/pages/MyPage.jsx'

  let html = await renderIn(server, badge, states.loading)
  check('헤더 배지: 불러오는 중이면 Lv.1 대신 "불러오는 중…"', html.includes('불러오는 중') && !html.includes('Lv.1') && html.includes('aria-busy="true"'))
  html = await renderIn(server, badge, states.switched)
  check('헤더 배지: 다른 계정으로 바뀐 직후에도 Lv.1로 잘못 보이지 않아요', html.includes('불러오는 중') && !html.includes('Lv.1'))
  html = await renderIn(server, badge, states.failed)
  check('헤더 배지: 실패하면 "다시 시도" 버튼 + 이유(접근성 이름)', html.includes('다시 시도') && html.includes('서버에 연결하지 못했어요') && !html.includes('Lv.1'))
  html = await renderIn(server, badge, states.ok)
  check('헤더 배지: 정상이면 예전처럼 레벨을 보여줘요', html.includes('Lv.1') && !html.includes('다시 시도'))
  html = await renderIn(server, badge, states.loggedOut)
  check('헤더 배지: 로그아웃이면 안내 없이 예전 그대로', html.includes('Lv.1') && !html.includes('불러오는 중'))

  html = await renderIn(server, record, states.loading)
  check('내 기록 카드: 불러오는 중 안내 (EXP 숫자를 보여주지 않아요)', html.includes('불러오고 있어요') && !html.includes('누적 EXP'))
  html = await renderIn(server, record, states.failed)
  check('내 기록 카드: 실패 안내 + 다시 시도 + 기록은 그대로라는 설명', html.includes('불러오지 못했어요') && html.includes('다시 시도') && html.includes('그대로예요') && !html.includes('누적 EXP'))
  html = await renderIn(server, record, states.ok)
  check('내 기록 카드: 정상이면 누적 EXP를 보여줘요', html.includes('누적 EXP 0'))
  html = await renderIn(server, record, states.loggedOut)
  check('내 기록 카드: 로그아웃이면 모험가 만들기 안내 그대로', html.includes('새 모험가 만들기') && !html.includes('불러오고 있어요'))

  html = await renderIn(server, myPage, states.loading)
  check('내 모험가 페이지: 불러오는 중이면 상태창 대신 안내 (0 EXP를 보여주지 않아요)', html.includes('내 모험 기록을 불러오고 있어요') && !html.includes('획득 배지') && !html.includes('누적 EXP'))
  html = await renderIn(server, myPage, states.switched)
  check('내 모험가 페이지: 다른 계정으로 바뀐 직후에도 이전 값 없이 안내', html.includes('내 모험 기록을 불러오고 있어요') && !html.includes('획득 배지'))
  html = await renderIn(server, myPage, states.failed)
  check('내 모험가 페이지: 실패하면 이유 + 다시 시도 + 기록은 그대로라는 설명', html.includes('내 모험 기록을 불러오지 못했어요') && html.includes('서버에 연결하지 못했어요.') && html.includes('다시 시도') && html.includes('서버에 저장된 기록은 그대로예요') && !html.includes('획득 배지'))
  html = await renderIn(server, myPage, states.ok)
  check('내 모험가 페이지: 정상이면 상태창 · 배지 · 도감을 보여줘요', html.includes('획득 배지') && !html.includes('불러오고 있어요') && !html.includes('불러오지 못했어요'))
  html = await renderIn(server, myPage, states.loggedOut)
  check('내 모험가 페이지: 로그아웃이면 모험가 만들기 안내 그대로', html.includes('아직 모험가가 없어요'))

  html = await renderIn(server, teaser, states.loading)
  check('홈 길드 카드: 불러오는 중 안내 + 어떤 레벨도 "현재"로 표시하지 않아요', html.includes('내 기록을 불러오고 있어요') && !html.includes('aria-current'))
  html = await renderIn(server, teaser, states.failed)
  check('홈 길드 카드: 실패 안내 + 다시 시도', html.includes('불러오지 못했어요') && html.includes('다시 시도'))
  html = await renderIn(server, teaser, states.ok)
  check('홈 길드 카드: 정상이면 내 모험가 상태를 보여줘요', html.includes('테스트모험가의 모험가 상태') && !html.includes('불러오고 있어요'))
  await server.close()
}

// ── 3. 로컬 모드는 그대로예요 (같은 loaded:false 상태여도 안내가 나오지 않아요) ──
{
  const server = await makeServer({ 'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('local') })
  const html = await renderIn(server, '/src/components/layout/HeaderLevelBadge.jsx', states.loading)
  check('로컬 모드: 불러오는 중 상태여도 예전처럼 레벨 배지를 보여줘요', html.includes('Lv.1') && !html.includes('불러오는 중'))
  await server.close()
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
