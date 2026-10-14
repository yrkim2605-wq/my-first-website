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
await db.exec(sql('../migrations/0004_community.sql'))
await db.exec(sql('../migrations/0006_review_content.sql')) // 리뷰 내용 글자 수 검사 (20자 이상)

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
const ins = (u, bakery, extra = '') => as(u).q(`insert into public.reviews (bakery_id, rating, content, photo_path ${extra}) values ($1, 4.5, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다', null ${extra ? ', true' : ''})`, [bakery])
check('유효한 빵집에 리뷰 작성', (await ins(A, 'k1')).error === null)
check('등록되지 않은 빵집 ID는 거부', (await ins(A, 'not-registered')).error !== null)
check('같은 빵집 두 번째 리뷰 거부(EXP 중복 방지)', (await ins(A, 'k1')).error !== null)
check('이메일 미인증 사용자는 리뷰 작성 불가', (await ins(C, 'k1')).error?.message.includes('EMAIL_NOT_VERIFIED') === true)
check('로그인하지 않으면 리뷰 작성 불가', (await ins(null, 'k2')).error !== null)

const mineExp = async (u) => (await as(u).q(`select exp, level_index, exp_review_count from public.user_progress where user_id = $1`, [u])).rows[0]
check('리뷰 1개 = 30 + 첫 리뷰 퀘스트 20 = 50 EXP', (await mineExp(A)).exp === 50, JSON.stringify(await mineExp(A)))

// 클라이언트가 EXP 칸을 직접 쓰려고 해도 막혀요
check('exp_review 컬럼을 직접 넣을 수 없어요(권한 없음)',
  (await as(A).q(`insert into public.reviews (bakery_id, rating, content, exp_review) values ('k3', 5, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다', true)`)).error !== null)
check('exp_review를 수정할 수 없어요',
  (await as(A).q(`update public.reviews set exp_review = false where user_id = $1`, [A])).error !== null)
check('user_id를 바꿔 남의 리뷰로 만들 수 없어요',
  (await as(A).q(`update public.reviews set user_id = $1 where user_id = $2`, [B, A])).error !== null)
check('작성자를 속여서 B 명의로 insert해도 거부',
  (await as(A).q(`insert into public.reviews (user_id, bakery_id, rating, content) values ($1,'k4',5,'맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다')`, [B])).error !== null)

// ── 수정은 EXP를 늘리지 않아요 / 삭제하면 회수돼요 ──
const before = (await mineExp(A)).exp
await as(A).q(`update public.reviews set content = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 수정', rating = 5 where user_id = $1`, [A])
check('리뷰 수정만으로 EXP가 늘지 않아요', (await mineExp(A)).exp === before)
await as(A).q(`update public.reviews set photo_path = $1 || '/p.jpg' where user_id = $1`, [A])
check('작성 후 사진을 붙여도 사진 EXP는 없어요', (await mineExp(A)).exp === before)
const del = await as(A).q(`delete from public.reviews where user_id = $1 returning id`, [A])
check('내 리뷰 삭제', del.rows.length === 1)
check('삭제하면 EXP가 회수돼요(0)', (await mineExp(A)).exp === 0, JSON.stringify(await mineExp(A)))

// ── 남의 리뷰는 못 고치고 못 지워요 ──
await ins(B, 'k5')
check('A는 B의 리뷰를 수정할 수 없어요(0행)', (await as(A).q(`update public.reviews set content='맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 해킹' where user_id=$1 returning id`, [B])).rows.length === 0)
check('A는 B의 리뷰를 삭제할 수 없어요(0행)', (await as(A).q(`delete from public.reviews where user_id=$1 returning id`, [B])).rows.length === 0)
check('로그인 없이도 공개 리뷰는 읽을 수 있어요', (await as(null).q(`select count(*)::int n from public.reviews`)).rows[0].n === 1)

// ── 사진 EXP: 작성할 때 사진이 있어야 + 지우면 사라져요 ──
await as(B).q(`delete from public.reviews where user_id=$1`, [B])
await as(B).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ('k6', 4, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 사진', $1 || '/a.jpg')`, [B])
check('작성 때 사진이 있으면 사진 EXP +10 (30+10+20=60)', (await mineExp(B)).exp === 60, JSON.stringify(await mineExp(B)))
check('다른 사람 폴더의 사진 경로는 거부',
  (await as(B).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ('k7', 4, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다', $1 || '/a.jpg')`, [A])).error !== null)
await as(B).q(`update public.reviews set photo_path = null where user_id=$1`, [B])
check('사진을 지우면 사진 EXP도 회수(50)', (await mineExp(B)).exp === 50, JSON.stringify(await mineExp(B)))
await as(B).q(`delete from public.reviews where user_id=$1`, [B])

// ── 하루 EXP 상한(기본 100 EXP) · 하루 작성 상한(20개) ──
const results = []
for (let i = 1; i <= 21; i += 1) results.push(await ins(A, `k${i}`))
const flags = (await as(A).q(`select exp_review from public.reviews where user_id=$1 order by created_at, bakery_id`, [A])).rows
check('하루 20개까지 작성, 21번째는 거부', results.slice(0, 20).every((r) => r.error === null) && results[20].error?.message.includes('DAILY_REVIEW_LIMIT'))
check('리뷰 EXP는 하루 100까지 → 30 × 3개만 지급(90)', flags.filter((f) => f.exp_review).length === 3, `실제 ${flags.filter((f) => f.exp_review).length}`)
// 3개: 30*3 + 첫 리뷰 20 + 빵집 3곳 30 + 지역 3곳 50 = 190 (퀘스트 보너스는 하루 상한 밖)
check('EXP = 90 + 퀘스트 100 = 190, 레벨 번호 2', JSON.stringify([(await mineExp(A)).exp, (await mineExp(A)).level_index]) === '[190,2]', JSON.stringify(await mineExp(A)))
check('도감은 EXP 상한과 별개로 20곳', (await as(A).q(`select discovered_count::int d from public.user_progress where user_id=$1`, [A])).rows[0].d === 20)
await as(A).q(`delete from public.reviews where user_id=$1`, [A])

// ── 상한 안에서 사진 EXP가 모자랄 때 · 상한을 바꾸면 반영 · 삭제하면 다시 받을 수 있음 ──
const photoIns = (u, bakery) => as(u).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ($1, 4, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 사진', $2 || '/p.jpg')`, [bakery, u])
const expFlags = async (u) => (await as(u).q(`select bakery_id, exp_review, exp_photo from public.reviews where user_id=$1 order by created_at`, [u])).rows
await ins(B, 'k11'); await ins(B, 'k12')      // 30 + 30 = 60 사용 → 남은 40
await photoIns(B, 'k13')                      // 30 + 사진 10 = 40 → 딱 맞음
let fb = await expFlags(B)
check('남은 EXP가 40이면 사진 리뷰는 리뷰+사진 EXP 모두 지급', fb[2].exp_review && fb[2].exp_photo, JSON.stringify(fb))
await photoIns(B, 'k14')
fb = await expFlags(B)
check('하루 100을 채우면 다음 리뷰는 저장만 되고 EXP 없음', fb[3].exp_review === false && fb[3].exp_photo === false, JSON.stringify(fb[3]))
await as(B).q(`delete from public.reviews where user_id=$1`, [B])
await ins(B, 'k11'); await ins(B, 'k12'); await ins(B, 'k15')   // 90 사용 → 남은 10
await photoIns(B, 'k16')
fb = await expFlags(B)
check('남은 EXP 10이면 EXP 없음(상한 초과 방지)', fb[3].exp_review === false, JSON.stringify(fb[3]))
await as(B).q(`delete from public.reviews where user_id=$1 and bakery_id='k15'`, [B])
await ins(B, 'k17'); await ins(B, 'k18')                       // k15 삭제로 30 반환 → 다시 받을 수 있음
await as(B).q(`delete from public.reviews where user_id=$1`, [B])
await ins(B, 'k11'); await ins(B, 'k12'); await photoIns(B, 'k13')   // 30 + 30 + 40
await as(B).q(`delete from public.reviews where user_id=$1 and bakery_id='k11'`, [B])
await photoIns(B, 'k11')                                       // 사진 리뷰(40) 삭제 후 재작성: 삭제로 EXP가 돌아가므로 순증가 없음
const rewritten = await expFlags(B)
const reviewPhotoExp = rewritten.filter((f) => f.exp_review).length * 30 + rewritten.filter((f) => f.exp_photo).length * 10
check('같은 빵집을 지우고 다시 써도 리뷰·사진 EXP 합계가 하루 100을 넘지 않아요', reviewPhotoExp <= 100, JSON.stringify(rewritten))
await as(B).q(`delete from public.reviews where user_id=$1`, [B])
await admin(`update public.game_settings set value = 200 where key = 'daily_exp_cap'`)
await ins(B, 'k11'); await ins(B, 'k12'); await ins(B, 'k13'); await ins(B, 'k14'); await ins(B, 'k15'); await ins(B, 'k16'); await ins(B, 'k17')
check('상한 설정을 200으로 바꾸면 하루 6개(180)까지 지급', (await expFlags(B)).filter((f) => f.exp_review).length === 6)
await admin(`update public.game_settings set value = 100 where key = 'daily_exp_cap'`)
check('클라이언트는 게임 설정을 바꿀 수 없어요', (await as(A).q(`update public.game_settings set value = 9999 where key = 'daily_exp_cap' returning key`)).error !== null)
check('게임 설정은 누구나 읽을 수 있어요', (await as(null).q(`select value from public.game_settings where key = 'daily_exp_cap'`)).rows[0]?.value === 100)
await as(B).q(`delete from public.reviews where user_id=$1`, [B])

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

// ── 커뮤니티 보안 (6단계): 글 · 댓글 · 좋아요 권한, 비로그인 차단, 하루 작성 상한, EXP 무관 ──
const expBeforeCommunity = await mineExp(A)
const expBeforeReviewCount = (await admin(`select count(*)::int n from public.reviews`))[0].n
const tryPost = (u, title = '제목', content = '내용', cat = 'recommend') =>
  as(u).q(`insert into public.posts (category_id, title, content) values ($1,$2,$3) returning id`, [cat, title, content])

check('비로그인은 글을 쓸 수 없어요', (await tryPost(null)).error !== null)
check('비로그인은 댓글을 쓸 수 없어요', (await as(null).q(`insert into public.comments (post_id, content) values (gen_random_uuid(),'x')`)).error !== null)
check('비로그인은 좋아요를 누를 수 없어요', (await as(null).q(`insert into public.post_likes (post_id) values (gen_random_uuid())`)).error !== null)
check('이메일 미인증은 좋아요 · 댓글 불가', await (async () => {
  const p = (await tryPost(A)).rows[0]
  const cm = await as(C).q(`insert into public.comments (post_id, content) values ($1,'x')`, [p.id])
  const lk = await as(C).q(`insert into public.post_likes (post_id) values ($1)`, [p.id])
  await as(A).q(`delete from public.posts where id=$1`, [p.id])
  return cm.error?.message.includes('EMAIL_NOT_VERIFIED') && lk.error?.message.includes('EMAIL_NOT_VERIFIED')
})())

check('제목 80자 초과 거부', (await tryPost(A, 'ㅁ'.repeat(81))).error !== null)
check('빈 제목(공백만) 거부', (await tryPost(A, '   ')).error !== null)
check('본문 2000자 초과 거부', (await tryPost(A, '제목', 'ㅁ'.repeat(2001))).error !== null)
check('글에 사진 경로를 남의 폴더로 지정 불가', (await as(A).q(`insert into public.posts (category_id, title, content, photo_path) values ('photo','t','c',$1)`, [`${B}/x.jpg`])).error !== null)
check('댓글 500자 초과 거부', await (async () => {
  const p = (await tryPost(A)).rows[0]
  const r = await as(B).q(`insert into public.comments (post_id, content) values ($1,$2)`, [p.id, 'ㅁ'.repeat(501)])
  await as(A).q(`delete from public.posts where id=$1`, [p.id])
  return r.error !== null
})())
check('없는 글에는 댓글 · 좋아요 불가', (await as(B).q(`insert into public.comments (post_id, content) values (gen_random_uuid(),'x')`)).error !== null
  && (await as(B).q(`insert into public.post_likes (post_id) values (gen_random_uuid())`)).error !== null)

const cp = (await tryPost(A, '커뮤니티 글', '본문')).rows[0]
const cc = (await as(B).q(`insert into public.comments (post_id, content) values ($1,'B의 댓글') returning id`, [cp.id])).rows[0]
const cr = (await as(A).q(`insert into public.comments (post_id, parent_id, content) values ($1,$2,'A의 답글') returning id`, [cp.id, cc.id])).rows[0]
check('글의 작성자(user_id) · 작성일은 바꿀 수 없어요', (await as(A).q(`update public.posts set user_id=$2 where id=$1`, [cp.id, B])).error !== null
  && (await as(A).q(`update public.posts set created_at = now() - interval '9 days' where id=$1`, [cp.id])).error !== null)
check('내 글은 수정할 수 있고 본문이 바뀌어요', await (async () => {
  const r = (await as(A).q(`update public.posts set content='수정한 본문' where id=$1 returning content`, [cp.id])).rows[0]
  return r?.content === '수정한 본문'
})())
check('비로그인은 남의 글을 수정 · 삭제할 수 없어요(0행)',
  (await as(null).q(`update public.posts set title='x' where id=$1 returning id`, [cp.id])).rows.length === 0
  && (await as(null).q(`delete from public.posts where id=$1 returning id`, [cp.id])).rows.length === 0)
check('이메일 미인증 사용자는 글 수정 불가', (await as(C).q(`update public.posts set title='x' where id=$1 returning id`, [cp.id])).rows.length === 0)
check('B는 A의 글을 다른 카테고리로도 바꿀 수 없어요', (await as(B).q(`update public.posts set category_id='photo' where id=$1 returning id`, [cp.id])).rows.length === 0)
check('다른 사람의 좋아요를 대신 지울 수 없어요', await (async () => {
  await as(B).q(`insert into public.post_likes (post_id) values ($1)`, [cp.id])
  const r = await as(A).q(`delete from public.post_likes where post_id=$1 and user_id=$2 returning post_id`, [cp.id, B])
  await as(B).q(`delete from public.post_likes where post_id=$1`, [cp.id])
  return r.rows.length === 0
})())

// 댓글 목록 뷰(0004)
const feedRows = (await as(A).q(`select id, parent_id, author_nickname, author_level_index::int lv, is_mine from public.comment_feed where post_id=$1 order by created_at`, [cp.id])).rows
check('댓글 뷰: 작성자 닉네임 · 레벨 · 답글 연결', feedRows.length === 2 && feedRows[0].author_nickname === '빵덕후B' && feedRows[1].parent_id === cc.id && feedRows.every((r) => Number.isInteger(r.lv)), JSON.stringify(feedRows))
check('댓글 뷰: 내 댓글 표시는 사용자별로 달라요', feedRows[0].is_mine === false && feedRows[1].is_mine === true
  && (await as(B).q(`select is_mine from public.comment_feed where id=$1`, [cc.id])).rows[0].is_mine === true)
check('댓글 뷰: 비로그인도 읽을 수 있고 is_mine은 false', await (async () => {
  const r = await as(null).q(`select is_mine from public.comment_feed where post_id=$1`, [cp.id])
  return r.error === null && r.rows.length === 2 && r.rows.every((x) => x.is_mine === false)
})())
check('글 목록 뷰도 비로그인이 읽을 수 있어요', (await as(null).q(`select id from public.post_feed where id=$1`, [cp.id])).rows.length === 1)
check('뷰로는 댓글을 쓰거나 지울 수 없어요', (await as(A).q(`insert into public.comment_feed (post_id, content) values ($1,'x')`, [cp.id])).error !== null
  && (await as(A).q(`delete from public.comment_feed where id=$1`, [cr.id])).error !== null)
check('A는 B의 댓글을 지울 수 없고, B는 자기 댓글을 지울 수 있어요(답글도 함께 삭제)',
  (await as(A).q(`delete from public.comments where id=$1 returning id`, [cc.id])).rows.length === 0
  && (await as(B).q(`delete from public.comments where id=$1 returning id`, [cc.id])).rows.length === 1
  && (await admin(`select count(*)::int n from public.comments where post_id=$1`, [cp.id]))[0].n === 0)

// 하루 작성 상한: 글 10개 · 댓글 50개 · 좋아요 200개 (한국 시간 기준)
await as(A).q(`delete from public.posts where user_id=$1`, [A])
const postResults = []
for (let i = 0; i < 11; i += 1) postResults.push(await tryPost(A, `상한 시험 ${i}`))
check('하루 글 10개까지, 11번째는 거부', postResults.slice(0, 10).every((r) => r.error === null) && postResults[10].error?.message.includes('DAILY_LIMIT'))
const limitPost = postResults[0].rows[0]
const commentResults = []
for (let i = 0; i < 51; i += 1) commentResults.push(await as(B).q(`insert into public.comments (post_id, content) values ($1,$2)`, [limitPost.id, `댓글 ${i}`]))
check('하루 댓글 50개까지, 51번째는 거부', commentResults.slice(0, 50).every((r) => r.error === null) && commentResults[50].error?.message.includes('DAILY_LIMIT'))
// 좋아요 200개 상한: 시험용 글 201개를 서버 권한으로 만들어요 (글 작성 트리거를 잠깐 꺼요)
await admin(`alter table public.posts disable trigger posts_before_insert`)
await admin(`insert into public.posts (user_id, category_id, title, content) select $1, 'recommend', 't' || g, 'c' from generate_series(1, 201) g`, [A])
await admin(`alter table public.posts enable trigger posts_before_insert`)
const likePosts = (await admin(`select id from public.posts where user_id=$1 and title like 't%' order by title`, [A])).map((r) => r.id)
let likeOk = 0
let lastLike = null
for (const id of likePosts) {
  lastLike = await as(B).q(`insert into public.post_likes (post_id) values ($1)`, [id])
  if (lastLike.error === null) likeOk += 1
}
check('하루 좋아요 200개까지, 201번째는 거부', likeOk === 200 && lastLike.error?.message.includes('DAILY_LIMIT'), `성공 ${likeOk}`)
await as(B).q(`delete from public.post_likes where user_id=$1`, [B])
await as(A).q(`delete from public.posts where user_id=$1`, [A])

const expAfterCommunity = await mineExp(A)
check('글 · 댓글 · 좋아요는 EXP · 레벨에 영향을 주지 않아요', expAfterCommunity.exp === expBeforeCommunity.exp && expAfterCommunity.level_index === expBeforeCommunity.level_index, JSON.stringify([expBeforeCommunity, expAfterCommunity]))
check('커뮤니티 시험이 리뷰 기록을 건드리지 않았어요', (await admin(`select count(*)::int n from public.reviews`))[0].n === expBeforeReviewCount)

// ── 다녀왔어요 체크 ──
check('방문 체크', (await as(A).q(`insert into public.bakery_visits (bakery_id) values ('k9')`)).error === null)
check('같은 빵집 중복 체크 거부', (await as(A).q(`insert into public.bakery_visits (bakery_id) values ('k9')`)).error !== null)
check('B는 A의 방문 기록을 볼 수 없어요', (await as(B).q(`select * from public.bakery_visits`)).rows.length === 0)
check('로그인 없이는 방문 기록을 볼 수 없어요', (await as(null).q(`select * from public.bakery_visits`)).error !== null)
const expWithVisit = await mineExp(A)
check('방문 체크는 EXP에 영향이 없어요', expWithVisit.exp === 80, JSON.stringify(expWithVisit))
check('B는 A의 방문 체크를 지울 수 없어요(0행)', (await as(B).q(`delete from public.bakery_visits where bakery_id='k9' returning bakery_id`)).rows.length === 0)
check('방문 체크 취소', (await as(A).q(`delete from public.bakery_visits where bakery_id='k9' returning bakery_id`)).rows.length === 1)
check('등록되지 않은 빵집은 방문 체크 불가(FK)', (await as(A).q(`insert into public.bakery_visits (bakery_id) values ('not-registered')`)).error !== null)
check('이메일 미인증 사용자는 방문 체크 불가', (await as(C).q(`insert into public.bakery_visits (bakery_id) values ('k9')`)).error?.message.includes('EMAIL_NOT_VERIFIED') === true)
check('남의 이름으로 방문 체크 불가(작성자는 서버가 로그인 사용자로 고정)', (await as(A).q(`insert into public.bakery_visits (user_id, bakery_id) values ($1,'k9')`, [B])).error !== null)
await as(A).q(`insert into public.bakery_visits (bakery_id) values ('k9'), ('k10')`)
check('방문 체크 여러 개를 남겨도 EXP · 도감 통계는 그대로', (await mineExp(A)).exp === 80 && (await as(A).q(`select discovered_count::int d from public.user_progress where user_id=$1`, [A])).rows[0].d === 2)
await as(A).q(`delete from public.bakery_visits where user_id=$1`, [A])

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
const settingsRows = Object.fromEntries((await admin('select key, value from public.game_settings')).map((r) => [r.key, r.value]))
check('설정 기본값 = 앱 규칙(리뷰 30 / 사진 10)', settingsRows.review_exp === num(/review:\s*(\d+)/, rules) && settingsRows.photo_exp === num(/reviewPhoto:\s*(\d+)/, rules), JSON.stringify(settingsRows))
const minExps = [...levels.matchAll(/minExp:\s*(\d+)/g)].map((m) => Number(m[1]))
check('규칙 일치: 레벨 기준 0/60/180/400/800', JSON.stringify(minExps) === '[0,60,180,400,800]', String(minExps))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
