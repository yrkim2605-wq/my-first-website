// Supabase 스키마 · RLS 검증 (PGlite = 브라우저/노드에서 도는 진짜 Postgres로 실행해요).
//
// 실행 방법 (프로젝트에 의존성을 추가하지 않도록, 임시 폴더에 설치해서 써요):
//   1) 빈 폴더에서  npm i @electric-sql/pglite
//   2) 그 폴더에서  node <이 파일 경로>      ← PGLITE_DIR 환경변수에 1)의 폴더를 알려줘요
//      예) PGLITE_DIR=$TEMP/sharp-tool node supabase/tests/rls.test.mjs
//
// 계정 2개(A, B)로 "남의 것은 못 고치고, EXP는 서버가 정하는지"를 확인해요.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)

const db = new PGlite()
const sql = (file) => fs.readFileSync(path.join(here, file), 'utf8')
await db.exec(sql('supabase_stub.sql'))
await db.exec(sql('../migrations/0001_schema.sql'))
await db.exec(sql('../migrations/0002_rls.sql'))

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

// 사용자 역할로 실행: as(userId|null) → { q(sql, params) }
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

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'

// ── 가입 · 프로필 ──
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'a@test.dev', now(), '{"nickname":"빵덕후A"}')`, [A])
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'b@test.dev', now(), '{"nickname":"빵덕후B"}')`, [B])
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'c@test.dev', null, '{"nickname":"미인증C"}')`, [C])
check('가입하면 프로필이 자동 생성돼요', (await admin('select count(*)::int n from public.profiles'))[0].n === 3)

for (const [label, nick] of [['대소문자만 다른 중복 닉네임', '빵덕후a'], ['너무 짧은 닉네임', '가'], ['특수문자 닉네임', '빵<script>']]) {
  let failed = false
  try {
    await admin(`insert into auth.users (email, raw_user_meta_data) values ($1, $2)`, [`x${Math.random()}@t.dev`, JSON.stringify({ nickname: nick })])
  } catch {
    failed = true
  }
  check(`가입 거부: ${label}`, failed)
}
check('닉네임 사용 가능 여부 함수', (await as(null).q(`select public.is_nickname_available('새닉네임') as ok, public.is_nickname_available('빵덕후B') as taken`)).rows[0].ok === true)

// ── 유효한 빵집 목록 (서버 비밀 키로만 등록하는 구역을 흉내) ──
const districts = ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae']
for (let i = 1; i <= 25; i += 1) {
  await admin(`insert into public.bakeries (id, name, district_id) values ($1, $2, $3)`, [`k${i}`, `테스트빵집${i}`, districts[i % 5]])
}
check('클라이언트는 빵집을 직접 등록할 수 없어요', (await as(A).q(`insert into public.bakeries (id, name, district_id) values ('fake','가짜','haeundae')`)).error !== null)

// ── 리뷰: 작성 · EXP 서버 계산 ──
const ins = (u, bakery, extra = '') => as(u).q(`insert into public.reviews (bakery_id, rating, content, photo_path ${extra}) values ($1, 4.5, '맛있어요 소금빵', null ${extra ? ', true' : ''})`, [bakery])
check('유효한 빵집에 리뷰 작성', (await ins(A, 'k1')).error === null)
check('등록되지 않은 빵집 ID는 거부', (await ins(A, 'not-registered')).error !== null)
check('같은 빵집 두 번째 리뷰 거부(EXP 중복 방지)', (await ins(A, 'k1')).error !== null)
check('이메일 미인증 사용자는 리뷰 작성 불가', (await ins(C, 'k1')).error?.message.includes('EMAIL_NOT_VERIFIED') === true)
check('로그인하지 않으면 리뷰 작성 불가', (await ins(null, 'k2')).error !== null)

const mineExp = async (u) => (await as(u).q(`select exp, level_index, exp_review_count from public.user_progress where user_id = $1`, [u])).rows[0]
check('리뷰 1개 = 30 + 첫 리뷰 퀘스트 20 = 50 EXP', (await mineExp(A)).exp === 50, JSON.stringify(await mineExp(A)))

// 클라이언트가 EXP 칸을 직접 쓰려고 해도 막혀요
check('exp_review 컬럼을 직접 넣을 수 없어요(권한 없음)',
  (await as(A).q(`insert into public.reviews (bakery_id, rating, content, exp_review) values ('k3', 5, 'x', true)`)).error !== null)
check('exp_review를 수정할 수 없어요',
  (await as(A).q(`update public.reviews set exp_review = false where user_id = $1`, [A])).error !== null)
check('user_id를 바꿔 남의 리뷰로 만들 수 없어요',
  (await as(A).q(`update public.reviews set user_id = $1 where user_id = $2`, [B, A])).error !== null)
check('작성자를 속여서 B 명의로 insert해도 거부',
  (await as(A).q(`insert into public.reviews (user_id, bakery_id, rating, content) values ($1,'k4',5,'x')`, [B])).error !== null)

// ── 수정은 EXP를 늘리지 않아요 / 삭제하면 회수돼요 ──
const before = (await mineExp(A)).exp
await as(A).q(`update public.reviews set content = '수정한 내용', rating = 5 where user_id = $1`, [A])
check('리뷰 수정만으로 EXP가 늘지 않아요', (await mineExp(A)).exp === before)
await as(A).q(`update public.reviews set photo_path = $1 || '/p.jpg' where user_id = $1`, [A])
check('작성 후 사진을 붙여도 사진 EXP는 없어요', (await mineExp(A)).exp === before)
const del = await as(A).q(`delete from public.reviews where user_id = $1 returning id`, [A])
check('내 리뷰 삭제', del.rows.length === 1)
check('삭제하면 EXP가 회수돼요(0)', (await mineExp(A)).exp === 0, JSON.stringify(await mineExp(A)))

// ── 남의 리뷰는 못 고치고 못 지워요 ──
await ins(B, 'k5')
check('A는 B의 리뷰를 수정할 수 없어요(0행)', (await as(A).q(`update public.reviews set content='해킹' where user_id=$1 returning id`, [B])).rows.length === 0)
check('A는 B의 리뷰를 삭제할 수 없어요(0행)', (await as(A).q(`delete from public.reviews where user_id=$1 returning id`, [B])).rows.length === 0)
check('로그인 없이도 공개 리뷰는 읽을 수 있어요', (await as(null).q(`select count(*)::int n from public.reviews`)).rows[0].n === 1)

// ── 사진 EXP: 작성할 때 사진이 있어야 + 지우면 사라져요 ──
await as(B).q(`delete from public.reviews where user_id=$1`, [B])
await as(B).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ('k6', 4, '사진 리뷰', $1 || '/a.jpg')`, [B])
check('작성 때 사진이 있으면 사진 EXP +10 (30+10+20=60)', (await mineExp(B)).exp === 60, JSON.stringify(await mineExp(B)))
check('다른 사람 폴더의 사진 경로는 거부',
  (await as(B).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ('k7', 4, 'x', $1 || '/a.jpg')`, [A])).error !== null)
await as(B).q(`update public.reviews set photo_path = null where user_id=$1`, [B])
check('사진을 지우면 사진 EXP도 회수(50)', (await mineExp(B)).exp === 50, JSON.stringify(await mineExp(B)))
await as(B).q(`delete from public.reviews where user_id=$1`, [B])

// ── 하루 EXP 상한(5개) · 하루 작성 상한(20개) ──
const results = []
for (let i = 1; i <= 21; i += 1) results.push(await ins(A, `k${i}`))
const flags = (await as(A).q(`select exp_review from public.reviews where user_id=$1 order by created_at, bakery_id`, [A])).rows
check('하루 20개까지 작성, 21번째는 거부', results.slice(0, 20).every((r) => r.error === null) && results[20].error?.message.includes('DAILY_REVIEW_LIMIT'))
check('그중 EXP 대상은 5개뿐', flags.filter((f) => f.exp_review).length === 5, `실제 ${flags.filter((f) => f.exp_review).length}`)
// 5개: 30*5 + 첫 리뷰 20 + 빵집 3곳 30 + 지역 3곳 50 = 250
check('EXP 5개 = 150 + 퀘스트 100 = 250, 레벨 3(0부터)', JSON.stringify([(await mineExp(A)).exp, (await mineExp(A)).level_index]) === '[250,2]', JSON.stringify(await mineExp(A)))
check('도감은 EXP 상한과 별개로 20곳', (await as(A).q(`select discovered_count::int d from public.user_progress where user_id=$1`, [A])).rows[0].d === 20)
await as(A).q(`delete from public.reviews where user_id=$1`, [A])

// ── 랭킹 ──
await ins(A, 'k1'); await ins(A, 'k2'); await ins(B, 'k3')
const lb = (await as(null).q(`select nickname, exp, rank::int from public.leaderboard order by rank, nickname`)).rows
check('랭킹: 리뷰가 있는 사용자만, EXP 순', lb.length === 2 && lb[0].nickname === '빵덕후A' && lb[0].exp === 80 && lb[1].exp === 50, JSON.stringify(lb))
check('랭킹에 리뷰 없는 사용자(미인증C)는 없어요', !lb.some((r) => r.nickname === '미인증C'))

// ── 게시글 · 댓글 · 좋아요 ──
const post = (await as(A).q(`insert into public.posts (category_id, title, content) values ('recommend','제목','내용') returning id`)).rows[0]
check('게시글 작성', !!post?.id)
check('이메일 미인증은 게시글 작성 불가', (await as(C).q(`insert into public.posts (category_id, title, content) values ('recommend','t','c')`)).error !== null)
check('잘못된 카테고리 거부', (await as(A).q(`insert into public.posts (category_id, title, content) values ('hack','t','c')`)).error !== null)
check('B는 A의 글을 수정할 수 없어요', (await as(B).q(`update public.posts set title='해킹' where id=$1 returning id`, [post.id])).rows.length === 0)
check('B는 A의 글을 삭제할 수 없어요', (await as(B).q(`delete from public.posts where id=$1 returning id`, [post.id])).rows.length === 0)
check('A는 자기 글을 수정할 수 있어요', (await as(A).q(`update public.posts set title='새 제목' where id=$1 returning id`, [post.id])).rows.length === 1)

const c1 = (await as(B).q(`insert into public.comments (post_id, content) values ($1,'댓글') returning id`, [post.id])).rows[0]
check('댓글 작성', !!c1?.id)
check('답글 작성(1단계)', (await as(A).q(`insert into public.comments (post_id, parent_id, content) values ($1,$2,'답글')`, [post.id, c1.id])).error === null)
const reply = (await admin(`select id from public.comments where parent_id = $1`, [c1.id]))[0]
check('답글의 답글은 거부(깊이 제한)', (await as(A).q(`insert into public.comments (post_id, parent_id, content) values ($1,$2,'깊은 답글')`, [post.id, reply.id])).error !== null)
check('댓글은 수정할 수 없어요', (await as(B).q(`update public.comments set content='수정' where id=$1`, [c1.id])).error !== null)
check('A는 B의 댓글을 삭제할 수 없어요', (await as(A).q(`delete from public.comments where id=$1 returning id`, [c1.id])).rows.length === 0)

check('좋아요 1회', (await as(B).q(`insert into public.post_likes (post_id) values ($1)`, [post.id])).error === null)
check('같은 글 좋아요 2번째는 거부(계정당 1회)', (await as(B).q(`insert into public.post_likes (post_id) values ($1)`, [post.id])).error !== null)
check('남의 이름으로 좋아요 불가', (await as(A).q(`insert into public.post_likes (post_id, user_id) values ($1,$2)`, [post.id, B])).error !== null)
const feedA = (await as(A).q(`select like_count::int l, comment_count::int c, liked_by_me, author_nickname, author_level_index::int lv from public.post_feed where id=$1`, [post.id])).rows[0]
const feedB = (await as(B).q(`select liked_by_me from public.post_feed where id=$1`, [post.id])).rows[0]
check('피드: 좋아요 1 · 댓글 2 · 작성자 닉네임/레벨', feedA.l === 1 && feedA.c === 2 && feedA.author_nickname === '빵덕후A' && feedA.lv >= 0, JSON.stringify(feedA))
check('피드: 내가 눌렀는지는 사용자별로 달라요', feedA.liked_by_me === false && feedB.liked_by_me === true)
check('좋아요 취소', (await as(B).q(`delete from public.post_likes where post_id=$1 returning post_id`, [post.id])).rows.length === 1)
check('A가 글을 지우면 댓글도 함께 삭제', (await as(A).q(`delete from public.posts where id=$1 returning id`, [post.id])).rows.length === 1 && (await admin('select count(*)::int n from public.comments'))[0].n === 0)

// ── 다녀왔어요 체크 ──
check('방문 체크', (await as(A).q(`insert into public.bakery_visits (bakery_id) values ('k9')`)).error === null)
check('같은 빵집 중복 체크 거부', (await as(A).q(`insert into public.bakery_visits (bakery_id) values ('k9')`)).error !== null)
check('B는 A의 방문 기록을 볼 수 없어요', (await as(B).q(`select * from public.bakery_visits`)).rows.length === 0)
check('로그인 없이는 방문 기록을 볼 수 없어요', (await as(null).q(`select * from public.bakery_visits`)).error !== null)
const expWithVisit = await mineExp(A)
check('방문 체크는 EXP에 영향이 없어요', expWithVisit.exp === 80, JSON.stringify(expWithVisit))
check('방문 체크 취소', (await as(A).q(`delete from public.bakery_visits where bakery_id='k9' returning bakery_id`)).rows.length === 1)

// ── 닉네임 변경 · 기타 ──
check('내 닉네임은 바꿀 수 있어요', (await as(A).q(`update public.profiles set nickname='새빵덕후' where id=$1 returning id`, [A])).rows.length === 1)
check('남의 닉네임은 못 바꿔요', (await as(A).q(`update public.profiles set nickname='가로채기' where id=$1 returning id`, [B])).rows.length === 0)
check('익명은 아무것도 쓸 수 없어요', (await as(null).q(`insert into public.posts (category_id,title,content) values ('recommend','t','c')`)).error !== null)

// ── 서버 규칙 = 앱 규칙 (JS 상수와 같은 숫자인지) ──
const rules = fs.readFileSync(path.join(here, '../../src/constants/gameRules.js'), 'utf8')
const levels = fs.readFileSync(path.join(here, '../../src/constants/levels.js'), 'utf8')
const num = (re, src) => Number(src.match(re)?.[1])
check('규칙 일치: 리뷰 30 / 사진 10', num(/review:\s*(\d+)/, rules) === 30 && num(/reviewPhoto:\s*(\d+)/, rules) === 10)
const bonus = [...rules.matchAll(/bonusExp:\s*(\d+)/g)].map((m) => Number(m[1]))
const targets = [...rules.matchAll(/target:\s*(\d+)/g)].map((m) => Number(m[1]))
check('규칙 일치: 퀘스트 보너스 20/30/50, 목표 1/3/3', JSON.stringify(bonus) === '[20,30,50]' && JSON.stringify(targets) === '[1,3,3]', `${bonus} ${targets}`)
const minExps = [...levels.matchAll(/minExp:\s*(\d+)/g)].map((m) => Number(m[1]))
check('규칙 일치: 레벨 기준 0/60/180/400/800', JSON.stringify(minExps) === '[0,60,180,400,800]', String(minExps))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
