// 실제 Supabase 서버 점검 스크립트 2 (의존성 없이 Node만 있으면 돼요). check-connection.mjs 다음 단계 점검이에요.
//
// 사용법 (프로젝트 폴더에서):  node supabase/check-live.mjs
//
// 로그인 없이(공개 키만으로) 확인할 수 있는 것만 확인해요. 데이터를 바꾸지 않아요 (쓰기 시도는 거부돼야 정상이고, 조건이 절대 맞지 않는 요청이에요).
//   ① 마이그레이션 0004~0006이 서버에 적용됐는지 (뷰 · 함수가 있는지)
//   ② 저장된 데이터가 공개 목록 · 랭킹에 반영되는지 (빵집 등록 → 일지 → 랭킹)
//   ③ 비로그인으로는 모든 표에 쓰기가 막히는지 (RLS · 권한)
//   ④ 빵집 확인 서버 함수가 살아 있고 로그인 없이는 거절하는지
//   ⑤ 신고 · 운영자(0009 · 0010): 비로그인으로는 읽기 · 쓰기 · 운영자 함수가 모두 막히는지
// 키 값 · 이메일은 출력하지 않아요. 로그인이 필요한 확인(저장 성공 여부, 내 순위 등)은 앱 화면에서 하세요.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envFile = process.env.ENV_FILE ?? path.join(root, '.env')
const env = {}
if (fs.existsSync(envFile)) {
  for (const rawLine of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const line = rawLine.trim()
    const eq = line.indexOf('=')
    if (eq > 0 && !line.startsWith('#')) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
}
const base = (env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
if (!base || !key || key.startsWith('sb_secret_')) {
  console.log('❌ .env의 VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY(공개용)가 필요해요.')
  process.exit(1)
}

let ok = 0
let fail = 0
let warn = 0
const report = (level, name, detail = '') => {
  if (level === 'ok') ok += 1
  else if (level === 'fail') fail += 1
  else warn += 1
  console.log(`${{ ok: '✅', fail: '❌', warn: '⚠️ ' }[level]} ${name}${detail ? ` — ${detail}` : ''}`)
}
const headers = { apikey: key, 'Content-Type': 'application/json' }
const get = async (pathAndQuery, extra = {}) => {
  const res = await fetch(`${base}/rest/v1/${pathAndQuery}`, { headers: { ...headers, ...extra } })
  const text = await res.text()
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, body, range: res.headers.get('content-range') }
}
const count = async (name) => {
  const res = await fetch(`${base}/rest/v1/${name}?select=*&limit=1`, { headers: { ...headers, Prefer: 'count=exact' } })
  const total = Number((res.headers.get('content-range') ?? '').split('/')[1])
  return (res.status === 200 || res.status === 206) && Number.isFinite(total) ? total : null
}

// ① 마이그레이션 적용 여부
console.log('— ① 마이그레이션 적용 확인 —')
for (const [name, migration] of [['comment_feed', '0004'], ['ranking_exp', '0005'], ['ranking_monthly_reviews', '0005'], ['ranking_bakeries', '0005'], ['ranking_posts', '0005']]) {
  const r = await get(`${name}?select=*&limit=1`)
  report(r.status === 200 ? 'ok' : 'fail', `뷰 ${name} (${migration})`, r.status === 200 ? '있음' : `HTTP ${r.status} — 마이그레이션 ${migration}을 적용했는지 확인하세요`)
}
{
  const res = await fetch(`${base}/rest/v1/rpc/review_meaningful_length`, { method: 'POST', headers, body: JSON.stringify({ p_text: '가 나 다 ' + String.fromCharCode(12288) + '라' }) })
  const body = await res.text()
  report(res.status === 200 && body.trim() === '4' ? 'ok' : 'fail', '글자 수 함수 review_meaningful_length (0006)', res.status === 200 ? `공백을 뺀 글자 수 계산 = ${body.trim()} (기대: 4)` : `HTTP ${res.status} — 0006을 적용했는지 확인하세요`)
}

// ② 저장된 데이터가 공개 목록 · 랭킹에 반영되는지
console.log('— ② 저장된 데이터 · 랭킹 반영 —')
const counts = {}
for (const name of ['bakeries', 'reviews', 'profiles', 'posts', 'comments', 'post_likes', 'ranking_exp', 'ranking_monthly_reviews', 'ranking_bakeries', 'ranking_posts']) counts[name] = await count(name)
console.log(`   개수: ${Object.entries(counts).map(([k, v]) => `${k}=${v ?? '?'}`).join(' · ')}`)
if (counts.reviews > 0) {
  report(counts.bakeries > 0 ? 'ok' : 'fail', '빵집이 서버 함수로 등록됨 (0007 효과)', `bakeries ${counts.bakeries}곳`)
  const latest = await get('reviews?select=content,rating,exp_review,exp_photo,created_at,bakeries(name,district_id),profiles(nickname)&order=created_at.desc&limit=3')
  if (latest.status === 200 && Array.isArray(latest.body)) {
    for (const row of latest.body) {
      const meaningful = Array.from(String(row.content)).filter((c) => c.trim() !== '' && c.codePointAt(0) !== 12288 && c.codePointAt(0) !== 8203).length
      console.log(`   최근 일지: ${row.profiles?.nickname ?? '?'} · ${row.bakeries?.name ?? '?'}(${row.bakeries?.district_id ?? '?'}) · 별점 ${row.rating} · exp_review=${row.exp_review} exp_photo=${row.exp_photo} · 공백 뺀 ${meaningful}자 · ${row.created_at}`)
    }
    const newest = latest.body[0]
    report(newest && newest.bakeries?.name ? 'ok' : 'fail', '최근 일지가 등록된 빵집(이름 · 지역)과 연결됨')
    report(newest?.exp_review === true ? 'ok' : 'warn', '최근 일지의 EXP 지급 표시(exp_review)', newest?.exp_review === true ? 'true' : '하루 EXP 한도를 넘었을 수 있어요')
  } else {
    report('fail', '최근 일지 조회', `HTTP ${latest.status}`)
  }
  report(counts.ranking_exp > 0 ? 'ok' : 'fail', 'EXP 순위(ranking_exp)에 반영됨', `${counts.ranking_exp}명`)
  report(counts.ranking_monthly_reviews > 0 ? 'ok' : 'warn', '이번 달 리뷰왕에 반영됨', `${counts.ranking_monthly_reviews}명`)
  report(counts.ranking_bakeries > 0 ? 'ok' : 'fail', '리뷰 많은 빵집에 반영됨', `${counts.ranking_bakeries}곳`)
  const top = await get('ranking_exp?select=rank,nickname,exp,level_index,review_count&order=rank.asc&limit=3')
  if (top.status === 200) console.log(`   EXP 순위 상위: ${top.body.map((r) => `${r.rank}위 ${r.nickname}(EXP ${r.exp}, 일지 ${r.review_count})`).join(' / ') || '없음'}`)
  // 빵집 평균 별점: 서버 집계(ranking_bakeries)가 reviews 표의 별점으로 직접 계산한 값과 같은지 (앱의 빵집 별점 표시가 읽는 값이에요)
  const allReviews = await get('reviews?select=bakery_id,rating&limit=1000')
  const bakeryStats = await get('ranking_bakeries?select=bakery_id,bakery_name,review_count,avg_rating&limit=1000')
  if (allReviews.status === 200 && bakeryStats.status === 200 && counts.reviews <= 1000) {
    const grouped = {}
    for (const row of allReviews.body) (grouped[row.bakery_id] ??= []).push(Math.round(Number(row.rating) * 2))
    const wrong = []
    for (const stat of bakeryStats.body) {
      const halves = grouped[stat.bakery_id] ?? []
      const n = halves.length
      const expected = n === 0 ? null : Math.floor((10 * halves.reduce((a, b) => a + b, 0) + n) / (2 * n)) / 10
      if (expected === null || Number(stat.avg_rating) !== expected || Number(stat.review_count) !== n) wrong.push(stat.bakery_name)
    }
    report(wrong.length === 0 && bakeryStats.body.length === Object.keys(grouped).length ? 'ok' : 'fail', '빵집 평균 별점 · 리뷰 개수가 reviews 표의 별점과 일치', wrong.length ? `불일치: ${wrong.join(', ')}` : `${bakeryStats.body.length}곳 모두 일치`)
    console.log(`   빵집별: ${bakeryStats.body.map((b) => `${b.bakery_name} ${Number(b.avg_rating).toFixed(1)}점(${b.review_count}개)`).join(' / ') || '없음'}`)
  }
  const ranks = await get('ranking_exp?select=rank&order=rank.asc&limit=50')
  report(ranks.status === 200 && ranks.body.every((r, i) => Number(r.rank) === i + 1) ? 'ok' : 'fail', '순위 번호가 1부터 겹치지 않고 이어짐')
} else {
  report('warn', '저장된 일지가 아직 없어요', '일지를 하나 저장한 뒤 다시 실행하면 랭킹 반영까지 확인해요')
}
{
  const policy = await get('profiles?select=*&limit=1')
  const columns = policy.status === 200 && policy.body[0] ? Object.keys(policy.body[0]) : []
  report(columns.length > 0 && !columns.some((c) => /email|password|phone/i.test(c)) ? 'ok' : 'warn', '공개 프로필에 이메일 · 개인정보 칸이 없어요', columns.join(', ') || '프로필 없음')
}

// ③ 비로그인 쓰기 차단 (조건이 절대 맞지 않는 요청 · 거부돼야 정상)
console.log('— ③ 비로그인 쓰기 차단 —')
const NIL = '00000000-0000-0000-0000-000000000000'
const attempts = [
  ['POST', 'bakeries', { id: '000', name: 'x', district_id: 'seomyeon' }],
  ['PATCH', `bakeries?id=eq.${NIL}`, { name: 'x' }],
  ['DELETE', `bakeries?id=eq.${NIL}`, null],
  ['POST', 'reviews', { bakery_id: '000', rating: 5, content: 'x' }],
  ['PATCH', `reviews?id=eq.${NIL}`, { content: 'x' }],
  ['DELETE', `reviews?id=eq.${NIL}`, null],
  ['POST', 'posts', { category_id: 'recommend', title: 'x', content: 'x' }],
  ['PATCH', `posts?id=eq.${NIL}`, { title: 'x' }],
  ['DELETE', `posts?id=eq.${NIL}`, null],
  ['POST', 'comments', { post_id: NIL, content: 'x' }],
  ['DELETE', `comments?id=eq.${NIL}`, null],
  ['POST', 'post_likes', { post_id: NIL }],
  ['DELETE', `post_likes?post_id=eq.${NIL}`, null],
  ['POST', 'bakery_visits', { bakery_id: '000' }],
  ['PATCH', `profiles?id=eq.${NIL}`, { nickname: 'hack' }],
  ['PATCH', 'game_settings?key=eq.daily_exp_cap', { value: 99999 }],
]
let allDenied = true
const notDenied = []
for (const [method, target, body] of attempts) {
  const res = await fetch(`${base}/rest/v1/${target}`, { method, headers: { ...headers, Prefer: 'return=minimal' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  if (res.status < 400) {
    allDenied = false
    notDenied.push(`${method} ${target.split('?')[0]} → HTTP ${res.status}`)
  }
}
report(allDenied ? 'ok' : 'fail', `표 ${new Set(attempts.map((a) => a[1].split('?')[0])).size}개에 대한 쓰기 ${attempts.length}가지가 모두 거절됨`, allDenied ? '' : notDenied.join(' / '))
{
  const visits = await get('bakery_visits?select=*&limit=1')
  report(visits.status >= 400 ? 'ok' : 'fail', '방문 체크(나만 보는 기록)는 비로그인으로 읽을 수 없음', `HTTP ${visits.status}`)
  const gs = await get('game_settings?select=key,value')
  const cap = Array.isArray(gs.body) ? gs.body.find((r) => r.key === 'daily_exp_cap')?.value : null
  report(Number(cap) === 100 ? 'ok' : 'warn', '하루 EXP 상한 설정이 그대로예요', `daily_exp_cap=${cap}`)
}

// ④ 빵집 확인 서버 함수
console.log('— ④ 빵집 확인 서버 함수(register-bakery) —')
{
  const fn = `${base}/functions/v1/register-bakery`
  const pre = await fetch(fn, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info' } })
  report(pre.status === 200 && pre.headers.get('access-control-allow-origin') === '*' ? 'ok' : 'fail', '브라우저 사전 확인(CORS)', `HTTP ${pre.status}`)
  const noAuth = await fetch(fn, { method: 'POST', headers, body: '{}' })
  const noAuthBody = await noAuth.json().catch(() => null)
  report(noAuth.status === 401 && noAuthBody?.error?.code === 'NOT_SIGNED_IN' ? 'ok' : 'fail', '로그인 없이는 거절(401 NOT_SIGNED_IN)', `HTTP ${noAuth.status}`)
  const getRes = await fetch(fn, { method: 'GET', headers })
  const getBody = await getRes.json().catch(() => null)
  report(getRes.status === 405 && getBody?.error?.code === 'METHOD_NOT_ALLOWED' ? 'ok' : 'warn', 'POST 외 요청은 거절(405)', `HTTP ${getRes.status}`)
}

// ⑤ 신고 · 운영자 (0009 · 0010): 비로그인으로는 읽기 · 쓰기 · 운영자 함수가 모두 막혀야 해요 (조건이 절대 맞지 않는 요청 · 거부돼야 정상)
console.log('— ⑤ 신고 · 운영자 (0009 · 0010) —')
{
  const post = (target, body) => fetch(`${base}/rest/v1/${target}`, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(body) })
  const denied = async (label, makeRequest) => {
    const res = await makeRequest()
    report(res.status >= 400 && res.status !== 404 ? 'ok' : 'fail', label, res.status === 404 ? 'HTTP 404 — 0009를 적용했는지 확인하세요' : `HTTP ${res.status}`)
  }
  await denied('비로그인은 신고 목록을 읽을 수 없음 (reports)', () => fetch(`${base}/rest/v1/reports?select=id&limit=1`, { headers }))
  await denied('비로그인은 운영자 목록을 읽을 수 없음 (admins)', () => fetch(`${base}/rest/v1/admins?select=user_id&limit=1`, { headers }))
  await denied('비로그인은 신고를 쓸 수 없음', () => post('reports', { target_type: 'post', target_id: NIL, reason: 'spam' }))
  await denied('비로그인은 운영자 목록에 쓸 수 없음', () => post('admins', { user_id: NIL }))
  await denied('비로그인은 신고를 고칠 수 없음', () => fetch(`${base}/rest/v1/reports?id=eq.${NIL}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'resolved' }) }))
  await denied('비로그인은 신고를 지울 수 없음', () => fetch(`${base}/rest/v1/reports?id=eq.${NIL}`, { method: 'DELETE', headers }))
  await denied('비로그인은 운영자 확인 함수(is_admin)를 쓸 수 없음', () => post('rpc/is_admin', {}))
  await denied('비로그인은 신고 처리 함수(admin_handle_report)를 쓸 수 없음', () => post('rpc/admin_handle_report', { p_report_id: NIL, p_action: 'dismiss', p_note: null }))
}

console.log(`\n통과 ${ok} · 실패 ${fail} · 주의 ${warn}`)
process.exit(fail > 0 ? 1 : 0)
