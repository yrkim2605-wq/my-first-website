// 오류 처리 점검: 오류 기록, ErrorBoundary 동작, 안내 화면(오류 · 404), 이용자에게 보이는 안내에 기술 정보가 없는지.
// (브라우저 없이 서버 렌더링 + 로직 시험. 실제 화면 확인은 브라우저에서 따로 했어요.)
// 실행: node supabase/tests/error-handling.test.mjs

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

// 브라우저 환경 흉내 (오류 기록이 콘솔 · 이벤트로만 나가는지 확인해요)
const events = []
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type
    this.detail = init?.detail
  }
}
globalThis.window = { dispatchEvent: (event) => events.push(event), addEventListener: (type, fn) => (listeners[type] = fn) }
const listeners = {}
const consoleCalls = []
const realConsoleError = console.error
console.error = (...args) => consoleCalls.push(args)

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
const wrap = (node) => clean(renderToString(h(ThemeProvider, { theme }, h(MemoryRouter, null, node))))
const { reportClientError, describeClientError, isChunkLoadError, installGlobalErrorLogging } = await server.ssrLoadModule('/src/utils/reportClientError.js')
const { default: ErrorBoundary, ErrorFallback } = await server.ssrLoadModule('/src/components/common/ErrorBoundary.jsx')
const { default: NotFound } = await server.ssrLoadModule('/src/pages/NotFound.jsx')

// ── 오류 기록 ──
{
  const secret = 'sb_secret_should_not_be_here'
  const error = new Error('x'.repeat(2000))
  const detail = describeClientError(error)
  check('오류 설명은 이름 · 메시지 · 스택만 담고 길이를 제한해요', Object.keys(detail).sort().join() === 'message,name,stack' && detail.message.length <= 500 && detail.stack.length <= 1500)
  consoleCalls.length = 0
  events.length = 0
  const logged = reportClientError(new TypeError('boom'), { source: 'test' })
  check('기록은 콘솔에 남고, 이벤트로도 나가요 (수집 도구를 붙일 자리)', consoleCalls.length === 1 && events.length === 1 && events[0].type === 'bakery:client-error' && logged.source === 'test' && logged.name === 'TypeError')
  check('기록에는 키 · 토큰 같은 값이 없어요', !JSON.stringify(logged).includes(secret))
  check('문자열 · null 같은 이상한 값도 기록할 수 있어요', reportClientError('문자열 오류').message === '문자열 오류' && reportClientError(null).name === 'object')
}
check('새 버전 배포 뒤 파일을 못 찾는 오류를 알아봐요', ['Failed to fetch dynamically imported module: https://x/a.js', 'error loading dynamically imported module', 'Importing a module script failed.', 'Loading chunk 12 failed.'].every((message) => isChunkLoadError(new Error(message))))
check('일반 오류는 파일 오류로 보지 않아요', !isChunkLoadError(new Error('Cannot read properties of undefined')) && !isChunkLoadError(null))
{
  consoleCalls.length = 0
  installGlobalErrorLogging()
  installGlobalErrorLogging() // 두 번 불러도 한 번만 붙어요
  listeners.error({ error: new Error('전역 오류'), message: '전역 오류' })
  listeners.unhandledrejection({ reason: new Error('약속 실패') })
  check('잡히지 않은 오류 · 처리되지 않은 Promise 실패도 기록돼요', consoleCalls.length === 2)
}

// ── ErrorBoundary ──
{
  check('오류가 나면 오류 상태로 바뀌어요', ErrorBoundary.getDerivedStateFromError(new Error('x')).error?.message === 'x')
  const boundary = new ErrorBoundary({ resetKey: '/a', children: 'ok' })
  boundary.setState = (next) => Object.assign(boundary.state, next)
  boundary.state = { error: new Error('x') }
  boundary.componentDidUpdate({ resetKey: '/a' })
  check('같은 페이지에서는 오류 상태를 유지해요', boundary.state.error !== null)
  boundary.componentDidUpdate({ resetKey: '/b' })
  check('다른 페이지로 이동하면(resetKey 변경) 오류 상태를 풀어요', boundary.state.error === null)
  boundary.state = { error: null }
  check('오류가 없으면 자식을 그대로 그려요', boundary.render() === 'ok')
  consoleCalls.length = 0
  boundary.componentDidCatch(new Error('렌더 오류'), { componentStack: '\n at Foo' })
  check('잡은 오류를 기록해요 (이용자 화면에는 안 보여요)', consoleCalls.length === 1 && events.at(-1).detail.source === 'ErrorBoundary')
}

// ── 오류 · 404 화면 ──
{
  const html = wrap(h(ErrorFallback, { error: new Error('Cannot read properties of undefined (reading secret)') }))
  check('오류 화면: 쉬운 안내 + 새로고침 · 첫 화면 버튼', html.includes('문제가 생겼어요') && html.includes('새로고침') && html.includes('첫 화면으로'))
  check('오류 화면에 오류 내용(내부 메시지)이 보이지 않아요', !html.includes('Cannot read') && !html.includes('secret'))
  const stale = wrap(h(ErrorFallback, { error: new Error('Failed to fetch dynamically imported module: /assets/x.js') }))
  check('새 버전 오류는 "새로고침하면 돼요"로 안내해요', stale.includes('새 버전이 나왔어요') && stale.includes('새로고침') && !stale.includes('/assets/x.js'))
  const notFound = wrap(h(NotFound))
  check('404 화면: 안내 + 첫 화면 버튼', notFound.includes('페이지를 찾을 수 없어요') && notFound.includes('첫 화면으로'))
}

// ── 연결(코드 구조) 점검 ──
{
  const here = path.dirname(fileURLToPath(import.meta.url))
  const read = (file) => fs.readFileSync(path.join(here, '../..', file), 'utf8')
  check('앱 맨 바깥(main.jsx)이 ErrorBoundary로 감싸져 있어요', /<ErrorBoundary>\s*<App \/>\s*<\/ErrorBoundary>/.test(read('src/main.jsx')) && read('src/main.jsx').includes('installGlobalErrorLogging()'))
  check('페이지 영역(Layout)은 주소가 바뀌면 오류 상태를 풀어요', /<ErrorBoundary resetKey=\{location\.pathname\}>/.test(read('src/components/layout/Layout.jsx')))
  check('없는 주소(*)는 NotFound 화면으로 가요', /<Route path="\*" element=\{<NotFound \/>\} \/>/.test(read('src/App.jsx')))
  check('운영자 화면에 권한이 없으면 404와 똑같은 화면이에요', /access === 'denied'\) return <NotFound \/>/.test(read('src/pages/AdminReports.jsx')))
}

// ── 이용자에게 보이는 안내에 기술 용어가 없는지 (저장소 오류 문구 전체) ──
{
  const { messages, operatorHints } = await server.ssrLoadModule('/src/storage/supabaseShared.js')
  const JARGON = /KAKAO_REST_API_KEY|0007_|0001~|마이그레이션|Verify JWT|CORS|Edge Functions|register-bakery|서버 관리자|service_role|\.sql/
  const bad = Object.entries(messages).filter(([, text]) => JARGON.test(text)).map(([key]) => key)
  check('저장소 오류 안내(messages)에 기술 용어가 없어요', bad.length === 0, bad.join(','))
  check('운영자용 기술 안내는 operatorHints에 따로 있어요', Object.keys(operatorHints).length >= 10)
  const ranking = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src/storage/supabaseRankingRepository.js'), 'utf8')
  check('순위 오류 안내에도 관리자용 문구(파일명)가 없어요', !/관리자: 0005/.test(ranking))
}

console.error = realConsoleError
await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
