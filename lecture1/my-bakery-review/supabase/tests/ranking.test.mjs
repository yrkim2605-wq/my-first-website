// 실제 랭킹(0005) 검증: 동점 규칙 · 한국 시간 월 경계 · 상위 10위 밖 내 순위 · 공개 범위/읽기 전용 권한 · 기존 데이터 불변.
// PGlite(진짜 Postgres)로 실행해요.
//   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/ranking.test.mjs   (설치법은 rls.test.mjs 위쪽 참고)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)

const sql = (file) => fs.readFileSync(path.join(here, file), 'utf8')
const MIGRATIONS = ['../migrations/0001_schema.sql', '../migrations/0002_rls.sql', '../migrations/0004_community.sql', '../migrations/0006_review_content.sql']
const RANKING_SQL = sql('../migrations/0005_rankings.sql')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const makeDb = async (withRanking) => {
  const db = new PGlite()
  await db.exec(sql('supabase_stub.sql'))
  for (const file of MIGRATIONS) await db.exec(sql(file))
  if (withRanking) await db.exec(RANKING_SQL)
  const as = (userId) => ({
    async q(text, params = []) {
      await db.exec(`reset role; ${userId ? `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`}`)
      try {
        return { rows: (await db.query(text, params)).rows, error: null }
      } catch (error) {
        return { rows: [], error }
      } finally {
        await db.exec('reset role')
      }
    },
  })
  const admin = async (text, params = []) => (await db.query(text, params)).rows
  return { db, as, admin }
}

const VIEWS = ['ranking_exp', 'ranking_monthly_reviews', 'ranking_bakeries', 'ranking_posts']

// ── 0. 데이터가 하나도 없을 때: 모든 랭킹이 빈 목록이에요 (예시 데이터가 섞이지 않아요) ──
{
  const { as } = await makeDb(true)
  for (const view of VIEWS) {
    const r = await as(null).q(`select * from public.${view}`)
    check(`빈 상태: ${view}는 오류 없이 0줄`, r.error === null && r.rows.length === 0, r.error?.message)
  }
}

// ── 1. 시험 데이터 만들기 (0005를 아직 적용하기 전: 기존 표만 써요) ──
const { db, as, admin } = await makeDb(false)
const [A, B, C, D] = ['a', 'b', 'c', 'd'].map((x) => `00000000-0000-0000-0000-00000000000${x}`)
const uuidOf = (n) => `00000000-0000-0000-0000-0000000001${String(n).padStart(2, '0')}`
const EXTRA = Array.from({ length: 12 }, (_, i) => uuidOf(i + 1))

const addUser = async (id, nickname, verified = true) =>
  admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, ${verified ? 'now()' : 'null'}, $3)`, [id, `${nickname}@test.dev`, JSON.stringify({ nickname })])
await addUser(A, '빵덕후A')
await addUser(B, '빵덕후B')
await addUser(C, '빵덕후C')
await addUser(D, '빵덕후D')
await addUser('00000000-0000-0000-0000-0000000000ee', '미인증E', false)
for (const [i, id] of EXTRA.entries()) await addUser(id, `extra${String(i + 1).padStart(2, '0')}`)

// 가입 시각: A < B < C < D < extra01 < extra02 …  (동점이면 먼저 가입한 쪽이 위)
const setSignup = async (id, day) => admin(`update public.profiles set created_at = $2::timestamptz where id = $1`, [id, `2026-01-${String(day).padStart(2, '0')}T00:00:00Z`])
await setSignup(A, 1)
await setSignup(B, 2)
await setSignup(C, 3)
await setSignup(D, 4)
for (const [i, id] of EXTRA.entries()) await setSignup(id, 10 + i)

const districts = ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae']
for (let i = 1; i <= 31; i += 1) await admin(`insert into public.bakeries (id, name, district_id) values ($1, $2, $3)`, [`k${i}`, `테스트빵집${i}`, districts[i % 5]])

const review = (u, bakery, rating) => as(u).q(`insert into public.reviews (bakery_id, rating, content) values ($1, $2, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다') returning id`, [bakery, rating])
// A: k1 k2 k3 / B: k1 k2 k3 k4 / C: k1 k2 k3  (k1 4점 · k2 5점 · k3 3점 · k4 5점)
const reviewIds = {}
const SEED_REVIEWS = [
  [A, 'A', [['k1', 4], ['k2', 5], ['k3', 3]]],
  [B, 'B', [['k1', 4], ['k2', 5], ['k3', 3], ['k4', 5]]],
  [C, 'C', [['k1', 4], ['k2', 5], ['k3', 3]]],
]
for (const [u, name, list] of SEED_REVIEWS) {
  for (const [bakery, rating] of list) {
    const r = await review(u, bakery, rating)
    if (r.error) throw new Error(`시험 데이터 실패 ${name} ${bakery}: ${r.error.message}`)
    reviewIds[`${name}-${bakery}`] = r.rows[0].id
  }
}
// 추가 모험가 12명: 앞 6명은 k20, 뒤 6명은 k21에 4점 일지 1개씩 (빵집 동점 → 이름순 확인용)
for (const [i, id] of EXTRA.entries()) {
  const r = await review(id, i < 6 ? 'k20' : 'k21', 4)
  if (r.error) throw new Error(`추가 모험가 일지 실패: ${r.error.message}`)
}

// 이번 달 경계(한국 시간): A의 k1 일지는 "이번 달 1일 0시 정각", A · C의 k3 일지는 "그 1초 전(지난달)"
const boundary = (await admin(`select (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') as ts`))[0].ts
await admin(`alter table public.reviews disable trigger reviews_before_update`)
await admin(`update public.reviews set created_at = $2::timestamptz where id = $1`, [reviewIds['A-k1'], boundary.toISOString()])
await admin(`update public.reviews set created_at = $2::timestamptz - interval '1 second' where id = any($1)`, [[reviewIds['A-k3'], reviewIds['C-k3']], boundary.toISOString()])
await admin(`alter table public.reviews enable trigger reviews_before_update`)

// 글 · 좋아요: A가 글 5개, B · C · D가 좋아요 (p1:3 · p2:2 · p3:2+댓글1 · p4:2 · p5:0)
const mkPost = async (title) => (await as(A).q(`insert into public.posts (category_id, title, content) values ('recommend', $1, '내용') returning id`, [title])).rows[0].id
const [p1, p2, p3, p4, p5] = [await mkPost('글1'), await mkPost('글2'), await mkPost('글3'), await mkPost('글4'), await mkPost('글5')]
const like = (u, p) => as(u).q(`insert into public.post_likes (post_id) values ($1)`, [p])
for (const u of [B, C, D]) await like(u, p1)
for (const p of [p2, p3, p4]) for (const u of [B, C]) await like(u, p)
await as(D).q(`insert into public.comments (post_id, content) values ($1, '댓글')`, [p3])
await admin(`alter table public.posts disable trigger posts_before_update`)
await admin(`update public.posts set created_at = '2026-02-01T00:00:00Z' where id = $1`, [p2])
await admin(`update public.posts set created_at = '2026-02-02T00:00:00Z' where id = $1`, [p4])
await admin(`alter table public.posts enable trigger posts_before_update`)

// ── 2. 0005 적용은 기존 표의 데이터를 바꾸지 않아요 (여러 번 실행해도 안전해요) ──
const BASE_TABLES = ['profiles', 'bakeries', 'reviews', 'posts', 'comments', 'post_likes', 'bakery_visits', 'game_settings']
const snapshot = async () => {
  const out = {}
  for (const t of BASE_TABLES) out[t] = (await admin(`select count(*)::int n, md5(coalesce(string_agg(x::text, '|' order by x::text), '')) h from public.${t} x`))[0]
  return out
}
const before = await snapshot()
await db.exec(RANKING_SQL)
const afterOnce = await snapshot()
let reapplyError = null
try {
  await db.exec(RANKING_SQL)
} catch (error) {
  reapplyError = error
}
const afterTwice = await snapshot()
check('0005를 적용해도 기존 표(8개)의 행 수 · 내용이 그대로예요', JSON.stringify(before) === JSON.stringify(afterOnce))
check('0005를 한 번 더 실행해도 오류 없이 그대로예요', reapplyError === null && JSON.stringify(before) === JSON.stringify(afterTwice), reapplyError?.message)

// ── 3. EXP 순위 ──
const exp = async (u = null) => (await as(u).q(`select rank::int rank, user_id, nickname, exp, level_index, review_count, discovered_count from public.ranking_exp order by rank`)).rows
let rows = await exp()
const nicknameOrder = rows.map((r) => r.nickname)
check('EXP 순위: 일지가 있는 모험가만 (D · 미인증E는 없어요)', rows.length === 15 && !nicknameOrder.includes('빵덕후D') && !nicknameOrder.includes('미인증E'), nicknameOrder.join(','))
check('EXP 순위: 순위 번호는 1부터 겹치지 않아요', rows.every((r, i) => r.rank === i + 1))
check('EXP 순위: EXP 190 동점이면 일지 수 → 가입 순 (B 4개 > A 3개(먼저 가입) > C 3개)', nicknameOrder.slice(0, 3).join(',') === '빵덕후B,빵덕후A,빵덕후C', nicknameOrder.slice(0, 3).join(','))
check('EXP 순위: 값이 서버 계산과 같아요 (190 · 일지 4/3/3 · 레벨 2)', rows[0].exp === 190 && rows[0].review_count === 4 && rows[1].exp === 190 && rows[0].level_index === 2, JSON.stringify(rows.slice(0, 3)))
check('EXP 순위: 추가 모험가 12명은 EXP 50 동점 → 먼저 가입한 순', rows.slice(3).every((r, i) => r.exp === 50 && r.nickname === `extra${String(i + 1).padStart(2, '0')}`))
await setSignup(A, 5) // A를 C보다 늦게 가입한 것으로 바꾸면 순서가 뒤집혀요 (동점 규칙이 가입 시각을 따르는지)
check('EXP 순위: 가입 시각을 바꾸면 동점 순서가 따라 바뀌어요', (await exp()).slice(0, 3).map((r) => r.nickname).join(',') === '빵덕후B,빵덕후C,빵덕후A')
await setSignup(A, 1)

// 상위 10위 밖의 내 순위: 필터한 뒤에도 전체 기준 순위가 나와요
const mine = (await as(EXTRA[11]).q(`select rank::int rank, exp from public.ranking_exp where user_id = $1`, [EXTRA[11]])).rows[0]
check('상위 10위 밖의 내 순위도 전체 기준으로 나와요 (15위)', mine?.rank === 15 && mine.exp === 50, JSON.stringify(mine))
check('순위에 없는 사람(일지 없는 D)은 내 순위 줄이 없어요', (await as(D).q(`select * from public.ranking_exp where user_id = $1`, [D])).rows.length === 0)

// ── 4. 이번 달 리뷰왕 (한국 시간) ──
const monthly = async () => (await as(null).q(`select rank::int rank, nickname, month_review_count::int n, exp, month_label from public.ranking_monthly_reviews order by rank`)).rows
rows = await monthly()
const monthOrder = rows.map((r) => `${r.nickname}:${r.n}`)
check('이번 달 리뷰왕: B 4 > A 2 = C 2 (A는 "이번 달 0시 정각" 일지 포함, 지난달 1초 전 일지는 제외)', monthOrder.slice(0, 3).join(',') === '빵덕후B:4,빵덕후A:2,빵덕후C:2', monthOrder.slice(0, 3).join(','))
check('이번 달 리뷰왕: 동점(A · C)은 EXP → 가입 순', rows[1].exp === rows[2].exp && rows[1].nickname === '빵덕후A')
check('이번 달 리뷰왕: 순위 번호는 1부터 겹치지 않아요', rows.every((r, i) => r.rank === i + 1))
const expectedLabel = (await admin(`select to_char(date_trunc('month', now() at time zone 'Asia/Seoul'), 'YYYY-MM') as m`))[0].m
check('이번 달 리뷰왕: month_label이 한국 시간 이번 달이에요', rows.every((r) => r.month_label === expectedLabel), expectedLabel)
await admin(`alter table public.reviews disable trigger reviews_before_update`)
await admin(`update public.reviews set created_at = $2::timestamptz where id = $1`, [reviewIds['A-k2'], boundary.toISOString()]) // 정각 → 여전히 이번 달
check('이번 달 경계: 정각(>=)은 이번 달로 세요', (await monthly()).find((r) => r.nickname === '빵덕후A').n === 2)
await admin(`update public.reviews set created_at = $2::timestamptz - interval '1 second' where id = $1`, [reviewIds['A-k2'], boundary.toISOString()])
check('이번 달 경계: 1초 전은 지난달이라 빠져요 (A 1개)', (await monthly()).find((r) => r.nickname === '빵덕후A').n === 1)
await admin(`update public.reviews set created_at = now() where id = $1`, [reviewIds['A-k2']])
await admin(`alter table public.reviews enable trigger reviews_before_update`)
check('이번 달 리뷰왕: 추가 모험가(1개)도 올라오고 상위 3명 뒤에 가입 순으로 이어져요', (await monthly()).slice(3, 5).map((r) => r.nickname).join(',') === 'extra01,extra02')

// ── 5. 리뷰 많은 빵집 ──
const bakeryRows = async () => (await as(null).q(`select rank::int rank, bakery_id, bakery_name, district_id, review_count::int n, avg_rating::float avg from public.ranking_bakeries order by rank`)).rows
rows = await bakeryRows()
check('리뷰 많은 빵집: 6개 → k20 · k21(6개 동점은 이름순) · k2(3개 5.0) · k1(4.0) · k3(3.0) · k4(1개)', rows.map((r) => r.bakery_id).join(',') === 'k20,k21,k2,k1,k3,k4', rows.map((r) => r.bakery_id).join(','))
check('리뷰 많은 빵집: 일지 수 · 평균 별점 · 지역 값', rows[2].n === 3 && rows[2].avg === 5 && rows[3].avg === 4 && rows[0].n === 6 && rows[0].district_id === districts[20 % 5], JSON.stringify(rows.slice(0, 4)))
check('리뷰 많은 빵집: 일지가 없는 빵집은 없어요', !rows.some((r) => r.bakery_id === 'k5') && rows.every((r, i) => r.rank === i + 1))

// ── 6. 좋아요 많은 글 ──
const postRows = async () => (await as(null).q(`select rank::int rank, post_id, title, author_nickname, author_level_index::int lv, like_count::int likes, comment_count::int comments from public.ranking_posts order by rank`)).rows
rows = await postRows()
check('좋아요 많은 글: 글1(3) → 글3(2 · 댓글 1) → 글2(2 · 먼저 쓴 글) → 글4(2 · 나중 글)', rows.map((r) => r.title).join(',') === '글1,글3,글2,글4', rows.map((r) => r.title).join(','))
check('좋아요 많은 글: 좋아요 0개 글5는 없고, 작성자 닉네임 · 레벨이 있어요', !rows.some((r) => r.post_id === p5) && rows[0].author_nickname === '빵덕후A' && Number.isInteger(rows[0].lv))
await as(D).q(`delete from public.post_likes where post_id = $1`, [p1])
check('좋아요를 취소하면 순위가 바로 바뀌어요 (글1은 2개로 내려가 글3 · 글2 · 글4 뒤)', (await postRows()).map((r) => r.title).join(',') === '글3,글2,글4,글1')
await as(A).q(`delete from public.posts where id = $1`, [p3])
check('글을 지우면 순위에서도 사라져요', (await postRows()).map((r) => r.title).join(',') === '글2,글4,글1')

// ── 7. 공개 범위와 읽기 전용 권한 ──
for (const view of VIEWS) {
  const anon = await as(null).q(`select * from public.${view} limit 1`)
  check(`비로그인도 ${view}를 읽을 수 있어요`, anon.error === null && anon.rows.length === 1, anon.error?.message)
  const cols = (await admin(`select column_name from information_schema.columns where table_schema='public' and table_name=$1`, [view])).map((c) => c.column_name)
  check(`${view}에는 이메일 · 개인 정보 칸이 없어요`, !cols.some((c) => /email|password|phone|token|secret/i.test(c)), cols.join(','))
}
const writes = {
  ranking_exp: [`insert into public.ranking_exp (user_id, nickname, exp) values (gen_random_uuid(), 'x', 9999)`, `update public.ranking_exp set exp = 9999`, `delete from public.ranking_exp`],
  ranking_monthly_reviews: [`update public.ranking_monthly_reviews set month_review_count = 999`, `delete from public.ranking_monthly_reviews`],
  ranking_bakeries: [`update public.ranking_bakeries set review_count = 999`, `delete from public.ranking_bakeries`],
  ranking_posts: [`update public.ranking_posts set like_count = 999`, `delete from public.ranking_posts`],
  comment_feed: [`update public.comment_feed set content = 'x'`, `delete from public.comment_feed`],
}
const dataBeforeWrites = await snapshot()
let allDenied = true
const notDenied = []
for (const [view, statements] of Object.entries(writes)) {
  for (const who of [null, A]) {
    for (const statement of statements) {
      const r = await as(who).q(statement)
      if (r.error === null) {
        allDenied = false
        notDenied.push(`${who ? '로그인' : '비로그인'}: ${statement}`)
      }
    }
  }
}
check('비로그인 · 로그인 모두 랭킹 뷰로 쓰기·수정·삭제를 할 수 없어요', allDenied, notDenied.join(' / '))
check('쓰기를 시도해도 원본 데이터는 그대로예요', JSON.stringify(dataBeforeWrites) === JSON.stringify(await snapshot()))
for (const view of [...VIEWS, 'comment_feed']) {
  const privileges = (await admin(`select has_table_privilege('anon', $1, 'SELECT') s, has_table_privilege('anon', $1, 'INSERT') i, has_table_privilege('anon', $1, 'UPDATE') u, has_table_privilege('anon', $1, 'DELETE') d, has_table_privilege('authenticated', $1, 'INSERT') ai, has_table_privilege('authenticated', $1, 'UPDATE') au, has_table_privilege('authenticated', $1, 'DELETE') ad`, [`public.${view}`]))[0]
  check(`${view} 권한: 읽기만 있고 쓰기 · 수정 · 삭제 권한은 없어요`, privileges.s && !privileges.i && !privileges.u && !privileges.d && !privileges.ai && !privileges.au && !privileges.ad, JSON.stringify(privileges))
}
check('랭킹은 방문 체크(나만 보는 기록)를 내보내지 않아요', (await as(null).q(`select * from public.bakery_visits`)).error !== null)

// ── 8. 순위가 서버 EXP와 같은 값을 보여줘요 (기존 leaderboard 뷰와 EXP 일치) ──
const oldBoard = (await as(null).q(`select nickname, exp from public.leaderboard order by nickname`)).rows
const newBoard = (await as(null).q(`select nickname, exp from public.ranking_exp order by nickname`)).rows
check('ranking_exp의 EXP가 기존 leaderboard와 일치해요', JSON.stringify(oldBoard) === JSON.stringify(newBoard))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
