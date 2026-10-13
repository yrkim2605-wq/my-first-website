// Supabase 연결 · 설정 점검 스크립트 (의존성 없이 Node만 있으면 돼요).
//
// 사용법 (프로젝트 폴더에서):  node supabase/check-connection.mjs
//
// 하는 일: .env의 VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY를 읽어서
//   ① 키가 "공개용"인지(비밀 키가 잘못 들어가지 않았는지)  ② 이메일 인증이 켜져 있는지
//   ③ 마이그레이션이 적용됐는지  ④ 비로그인 상태에서 쓰기/비공개 읽기가 막히는지 확인해요.
// 키 값은 화면에 출력하지 않아요. 읽기 점검 외에 DB를 바꾸지 않아요(쓰기 시도는 거부돼야 정상이에요).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const readEnv = () => {
  const file = process.env.ENV_FILE ?? path.join(root, '.env')
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')]),
  )
}

const results = []
const report = (level, name, detail = '') => {
  results.push(level)
  const icon = { ok: '✅', warn: '⚠️ ', fail: '❌' }[level]
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`)
}

const env = readEnv()
const url = (env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

if (!url || !key) {
  console.log('VITE_SUPABASE_URL 또는 VITE_SUPABASE_PUBLISHABLE_KEY가 .env에 없어요. env.example을 참고해서 채워 주세요.')
  process.exit(1)
}

// ① 형식과 키 종류
if (/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) report('ok', '프로젝트 주소 형식')
else report('fail', '프로젝트 주소 형식', 'https://프로젝트ID.supabase.co 모양이어야 해요')

const decodeJwtRole = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).role
  } catch {
    return null
  }
}
if (key.startsWith('sb_secret_') || decodeJwtRole(key) === 'service_role') {
  report('fail', '🚨 비밀 키가 들어 있어요', '이 키는 브라우저에 노출되면 DB 전체가 뚫려요. 대시보드에서 해당 키를 재발급(교체)하고 publishable 키로 바꿔 주세요')
  process.exit(1)
}
if (key.startsWith('sb_publishable_') || decodeJwtRole(key) === 'anon') report('ok', '공개용 키 종류', key.startsWith('sb_publishable_') ? 'publishable' : '기존 anon')
else report('warn', '키 종류를 알 수 없어요', 'sb_publishable_ 로 시작하는 키인지 확인해 주세요')

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
const call = async (method, route, body) => {
  try {
    const res = await fetch(`${url}${route}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      // JSON이 아니면 그대로 둬요
    }
    return { status: res.status, json }
  } catch (error) {
    return { status: 0, json: null, error: error.message }
  }
}

// ② 인증 설정
const settings = await call('GET', '/auth/v1/settings')
if (settings.status === 0) {
  report('fail', '서버에 연결할 수 없어요', settings.error)
  process.exit(1)
}
if (settings.status === 200) {
  report('ok', '서버 연결 · 키 인정')
  if (settings.json?.mailer_autoconfirm === false) report('ok', '이메일 인증 필수(Confirm email 켜짐)')
  else if (settings.json?.mailer_autoconfirm === true) report('fail', '이메일 인증이 꺼져 있어요', 'Authentication → Sign In / Providers → Email → Confirm email 을 켜 주세요')
  else report('warn', '이메일 인증 설정을 읽지 못했어요', '대시보드에서 직접 확인해 주세요')
  if (settings.json?.external?.email === false) report('fail', '이메일 가입이 꺼져 있어요')
} else {
  report('fail', '키가 거부됐어요', `HTTP ${settings.status} — URL과 키가 같은 프로젝트의 것인지 확인해 주세요`)
}

// ③ 마이그레이션 적용 여부
const tables = ['profiles', 'bakeries', 'reviews', 'posts', 'comments', 'post_likes', 'game_settings']
for (const table of tables) {
  const res = await call('GET', `/rest/v1/${table}?select=*&limit=1`)
  if (res.status === 200) report('ok', `테이블 ${table} 읽기`)
  else report('fail', `테이블 ${table}`, res.status === 404 || res.json?.code === 'PGRST205' ? '아직 없어요 → 0001/0002 SQL을 적용해 주세요' : `HTTP ${res.status} ${res.json?.message ?? ''}`)
}
const cap = await call('GET', '/rest/v1/game_settings?select=value&key=eq.daily_exp_cap')
if (cap.status === 200 && Array.isArray(cap.json) && cap.json[0]) report('ok', '하루 EXP 상한 설정', String(cap.json[0].value))
else report('fail', '하루 EXP 상한(game_settings.daily_exp_cap)을 읽지 못했어요', '0001_schema.sql이 끝까지 실행됐는지 확인해 주세요')
for (const view of ['leaderboard', 'post_feed']) {
  const res = await call('GET', `/rest/v1/${view}?select=*&limit=1`)
  if (res.status === 200) report('ok', `뷰 ${view} 읽기`)
  else report('fail', `뷰 ${view}`, `HTTP ${res.status}`)
}

// ④ 비로그인 보안 점검: 막혀야 정상이에요
const mustBlock = [
  ['비로그인 빵집 등록', 'POST', '/rest/v1/bakeries', { id: 'check-should-fail', name: 'x', district_id: 'haeundae' }],
  ['비로그인 리뷰 작성', 'POST', '/rest/v1/reviews', { bakery_id: 'x', rating: 5, content: 'x' }],
  ['비로그인 게시글 작성', 'POST', '/rest/v1/posts', { category_id: 'recommend', title: 'x', content: 'x' }],
  ['비로그인 방문 기록 읽기', 'GET', '/rest/v1/bakery_visits?select=*&limit=1'],
]
for (const [name, method, route, body] of mustBlock) {
  const res = await call(method, route, body)
  if (res.status >= 400) report('ok', `${name} 차단됨`, `HTTP ${res.status}`)
  else report('fail', `${name}이 막히지 않았어요 (HTTP ${res.status})`, '0002_rls.sql이 적용됐는지, RLS가 켜져 있는지 확인해 주세요')
}

const fails = results.filter((r) => r === 'fail').length
const warns = results.filter((r) => r === 'warn').length
console.log(`\n${fails === 0 ? '통과' : '실패'} · 실패 ${fails} · 주의 ${warns}`)
process.exit(fails === 0 ? 0 : 1)
