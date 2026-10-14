// 리뷰 내용 글자 수 규칙(0006) 검증: 공백을 뺀 20자 이상 · 전체 500자 이하.
//  - 경계값(19 · 20 · 500 · 501자), 공백만 입력, 눈에 안 보이는 공백, 이모지
//  - 기존 짧은 일지 보존, 고칠 때도 같은 규칙, EXP · 하루 한도 정책 유지
//  - 화면 계산(src/utils/reviewContent.js) = 서버 계산(review_meaningful_length) 일치 (무작위 시험 포함)
// PGlite(진짜 Postgres)로 실행해요.
//   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/review-content.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)
const { countMeaningfulChars, getReviewContentStatus, REVIEW_CONTENT_MIN, REVIEW_CONTENT_MAX } = await import(
  pathToFileURL(path.join(here, '../../src/utils/reviewContent.js')).href
)

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const sql = (file) => fs.readFileSync(path.join(here, file), 'utf8')
const db = new PGlite()
await db.exec(sql('supabase_stub.sql'))
await db.exec(sql('../migrations/0001_schema.sql'))
await db.exec(sql('../migrations/0002_rls.sql'))

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

const ids = ['a', 'b', 'c', 'd', 'e'].map((x) => `00000000-0000-0000-0000-00000000000${x}`)
const [A, B, C, D, E] = ids
for (const [i, id] of ids.entries()) {
  await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3)`, [id, `u${i}@test.dev`, JSON.stringify({ nickname: `시험${i}` })])
}
const districts = ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae']
for (let i = 1; i <= 60; i += 1) await admin(`insert into public.bakeries (id, name, district_id) values ($1, $2, $3)`, [`k${i}`, `테스트빵집${i}`, districts[i % 5]])

// 눈에 안 보이는 공백 글자는 번호로 만들어요
const ch = (...codes) => String.fromCharCode(...codes)
const NBSP = ch(160)
const FULLWIDTH = ch(12288)
const ZERO_WIDTH = ch(8203)
const BOM = ch(65279)

// ── 1. 0006 적용 전에 저장된 짧은 일지 (이미 있는 데이터) ──
const legacy = []
for (const [bakery, text] of [['k1', '맛집'], ['k2', 'x'], ['k3', '굿 굿 굿']]) {
  const r = await as(A).q(`insert into public.reviews (bakery_id, rating, content) values ($1, 4, $2) returning id`, [bakery, text])
  if (r.error) throw new Error('기존 일지 만들기 실패: ' + r.error.message)
  legacy.push(r.rows[0].id)
}
const snapshot = async () => (await admin(`select count(*)::int n, md5(coalesce(string_agg(r::text, '|' order by r::text), '')) h from public.reviews r`))[0]
const before = await snapshot()
await db.exec(sql('../migrations/0006_review_content.sql'))
let reapplyError = null
try {
  await db.exec(sql('../migrations/0006_review_content.sql'))
} catch (error) {
  reapplyError = error
}
const after = await snapshot()
check('0006을 적용해도(두 번 실행해도) 기존 일지 3개는 삭제 · 변경되지 않아요', JSON.stringify(before) === JSON.stringify(after) && before.n === 3 && reapplyError === null, reapplyError?.message)
check('기존 20자 미만 일지도 그대로 읽혀요', (await as(null).q(`select content from public.reviews where id = any($1) order by content`, [legacy])).rows.length === 3)

// ── 2. 새 일지: 경계값 · 공백 ──
let bakeryNo = 10
const tryInsert = async (user, content) => {
  bakeryNo += 1
  const r = await as(user).q(`insert into public.reviews (bakery_id, rating, content) values ($1, 5, $2) returning id`, [`k${bakeryNo}`, content])
  return r
}
const rep = (text, n) => text.repeat(n)
const cases = [
  ['19자', rep('가', 19), 'REVIEW_TOO_SHORT'],
  ['20자', rep('가', 20), null],
  ['500자', rep('가', 500), null],
  ['501자', rep('가', 501), 'REVIEW_TOO_LONG'],
  ['빈 내용', '', 'REVIEW_TOO_SHORT'],
  ['띄어쓰기만', rep(' ', 30), 'REVIEW_TOO_SHORT'],
  ['줄바꿈 · 탭만', rep('\n\t ', 20), 'REVIEW_TOO_SHORT'],
  ['19자 + 공백 30개 (공백은 세지 않아요)', rep('가', 19) + rep(' ', 30), 'REVIEW_TOO_SHORT'],
  ['글자마다 띄어 쓴 20자 (공백 포함 39자)', rep('가 ', 19) + '가', null],
  ['앞뒤 공백 + 20자', '   ' + rep('나', 20) + '   ', null],
  ['NBSP · 전각 공백 · 너비 0 공백으로 채운 19자', rep('다', 5) + NBSP + rep('다', 5) + FULLWIDTH + rep('다', 5) + ZERO_WIDTH + rep('다', 4) + BOM + NBSP + FULLWIDTH, 'REVIEW_TOO_SHORT'],
  ['눈에 안 보이는 공백만 가득', rep(NBSP + FULLWIDTH + ZERO_WIDTH + BOM, 30), 'REVIEW_TOO_SHORT'],
  ['이모지 20개 (이모지 1개 = 1자)', rep('🥐', 20), null],
  ['이모지 19개', rep('🥐', 19), 'REVIEW_TOO_SHORT'],
  ['글자 480 + 중간 공백 20 (전체 정확히 500)', rep('라', 240) + rep(' ', 20) + rep('라', 240), null],
  ['글자 480 + 중간 공백 21 (전체 501)', rep('라', 240) + rep(' ', 21) + rep('라', 240), 'REVIEW_TOO_LONG'],
  ['글자 450 + 중간 공백 60 (전체 510 > 500)', rep('마', 225) + rep(' ', 60) + rep('마', 225), 'REVIEW_TOO_LONG'],
]
const results = []
let tryUser = B
for (const [label, content, expectedError] of cases) {
  // 하루 작성 한도(20개)를 넘지 않게 사용자를 바꿔 가며 시험해요
  if (results.filter((r) => !r.error).length % 6 === 5) tryUser = tryUser === B ? C : tryUser === C ? D : E
  const r = await tryInsert(tryUser, content)
  results.push(r)
  const message = r.error?.message ?? ''
  const ok = expectedError ? message.includes(expectedError) : r.error === null
  check(`서버: ${label} → ${expectedError ? '거절(' + expectedError + ')' : '저장'}`, ok, r.error ? message : 'saved')
}
const mismatches = cases.filter(([, content, expectedError], i) => getReviewContentStatus(content.trim()).isValid !== (results[i].error === null) || (expectedError === null) !== getReviewContentStatus(content.trim()).isValid)
check('화면 판단(저장 버튼 잠금) = 서버 결과 (모든 경계 사례)', mismatches.length === 0, mismatches.map(([label]) => label).join(' / '))
check('경계: 19자는 부족(1자 남음), 20자는 통과, 500자 통과, 501자 초과', (() => {
  const s19 = getReviewContentStatus(rep('가', 19))
  return s19.isTooShort && s19.remaining === 1 && getReviewContentStatus(rep('가', 20)).isValid && getReviewContentStatus(rep('가', 500)).isValid && getReviewContentStatus(rep('가', 501)).isTooLong
})())
check('규칙 상수: 최소 20 · 최대 500', REVIEW_CONTENT_MIN === 20 && REVIEW_CONTENT_MAX === 500)

// 거절된 일지는 DB에 남지 않아요
const savedCount = results.filter((r) => !r.error).length
const totalNew = (await admin(`select count(*)::int n from public.reviews where user_id = any($1)`, [[B, C, D, E]]))[0].n
check('거절된 일지는 저장되지 않아요', totalNew === savedCount, `${totalNew} vs ${savedCount}`)

// ── 3. 고칠 때도 같은 규칙, 기존 짧은 일지는 별점/사진만 고치는 건 막지 않아요 ──
const mineId = results.find((r) => !r.error).rows[0].id
const ownerOf = async (id) => (await admin(`select user_id from public.reviews where id = $1`, [id]))[0].user_id
const owner = await ownerOf(mineId)
check('고치기: 내용을 19자로 줄이면 거절', (await as(owner).q(`update public.reviews set content = $2 where id = $1`, [mineId, rep('바', 19)])).error?.message.includes('REVIEW_TOO_SHORT'))
check('고치기: 공백만으로 바꾸면 거절', (await as(owner).q(`update public.reviews set content = $2 where id = $1`, [mineId, rep(' ', 40)])).error?.message.includes('REVIEW_TOO_SHORT'))
check('고치기: 501자로 늘리면 거절', (await as(owner).q(`update public.reviews set content = $2 where id = $1`, [mineId, rep('사', 501)])).error?.message.includes('REVIEW_TOO_LONG'))
check('고치기: 20자 · 500자는 통과', (await as(owner).q(`update public.reviews set content = $2 where id = $1 returning id`, [mineId, rep('아', 20)])).rows.length === 1
  && (await as(owner).q(`update public.reviews set content = $2 where id = $1 returning id`, [mineId, rep('아', 500)])).rows.length === 1)
check('고치기가 거절돼도 원래 내용이 남아 있어요', (await admin(`select char_length(content)::int n from public.reviews where id = $1`, [mineId]))[0].n === 500)
check('기존 짧은 일지: 별점만 고치는 요청(내용 칸 없음)은 막지 않아요', (await as(A).q(`update public.reviews set rating = 3 where id = $1 returning rating`, [legacy[0]])).rows.length === 1)
check('기존 짧은 일지: 사진만 바꾸는 요청도 막지 않아요', (await as(A).q(`update public.reviews set photo_path = $2 where id = $1 returning id`, [legacy[1], A + '/x.jpg'])).rows.length === 1)
check('기존 짧은 일지: 내용을 다시 짧게 보내면 거절(고칠 때도 같은 기준)', (await as(A).q(`update public.reviews set content = $2 where id = $1`, [legacy[2], '굿굿'])).error?.message.includes('REVIEW_TOO_SHORT'))
check('기존 짧은 일지: 20자 이상으로 늘려 고치면 통과', (await as(A).q(`update public.reviews set content = $2 where id = $1 returning id`, [legacy[2], rep('굿', 20)])).rows.length === 1)
check('기존 짧은 일지: 삭제는 그대로 할 수 있어요', (await as(A).q(`delete from public.reviews where id = $1 returning id`, [legacy[0]])).rows.length === 1)

// ── 4. EXP · 하루 한도 정책은 그대로 ──
// 새 사용자 F: 서로 다른 지역 4곳 (k61~64가 없으므로 k41~44 사용: 지역 번호 = id % 5)
const F = '00000000-0000-0000-0000-00000000000f'
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'f@test.dev', now(), '{"nickname":"시험F"}')`, [F])
const exps = []
const enough = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
for (const bakery of ['k41', 'k42', 'k43']) exps.push((await as(F).q(`insert into public.reviews (bakery_id, rating, content) values ($1, 5, $2) returning exp_review`, [bakery, enough])).rows[0].exp_review)
const rejected = await as(F).q(`insert into public.reviews (bakery_id, rating, content) values ('k44', 5, '짧아요')`)
const countAfterRejected = (await admin(`select count(*)::int n from public.reviews where user_id = $1`, [F]))[0].n
exps.push((await as(F).q(`insert into public.reviews (bakery_id, rating, content) values ('k44', 5, $1) returning exp_review`, [enough])).rows[0].exp_review)
check('짧은 일지가 거절돼도 저장 개수 · 하루 한도에 영향 없음', rejected.error !== null && countAfterRejected === 3)
check('EXP 정책 유지: 하루 100 EXP까지 → 앞의 3개만 EXP(true,true,true,false)', JSON.stringify(exps) === '[true,true,true,false]', JSON.stringify(exps))
const progress = (await as(F).q(`select exp, level_index from public.user_progress where user_id = $1`, [F])).rows[0]
check('EXP 합계 190 · 레벨 번호 2 (예전과 같아요)', progress.exp === 190 && progress.level_index === 2, JSON.stringify(progress))
check('비로그인은 여전히 일지를 쓸 수 없어요', (await as(null).q(`insert into public.reviews (bakery_id, rating, content) values ('k45', 5, $1)`, [enough])).error !== null)
check('다른 사람 일지의 내용은 여전히 고칠 수 없어요(0행)', (await as(F).q(`update public.reviews set content = $2 where id = $1 returning id`, [mineId, enough])).rows.length === 0)

// ── 5. 화면 계산 = 서버 계산 (무작위 400개) ──
const POOL = [
  ...'가나다라마바사아자차카타파하'.split(''), ...'abcXYZ0129'.split(''), ' ', ' ', ' ', '\n', '\t', '\r', NBSP, FULLWIDTH, ZERO_WIDTH, BOM,
  ch(5760), ch(8192), ch(8202), ch(8232), ch(8233), ch(8239), ch(8287), ch(11), ch(12), '🥐', '😀', '한', '글',
]
let seed = 12345
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
let parityBad = 0
let firstBad = ''
for (let n = 0; n < 400; n += 1) {
  const length = Math.floor(random() * 60)
  let text = ''
  for (let i = 0; i < length; i += 1) text += POOL[Math.floor(random() * POOL.length)]
  const serverCount = (await admin(`select public.review_meaningful_length($1) as n`, [text]))[0].n
  if (serverCount !== countMeaningfulChars(text)) {
    parityBad += 1
    if (!firstBad) firstBad = JSON.stringify(text.split('').map((c) => c.codePointAt(0)))
  }
}
check('화면 글자 수 계산 = 서버 글자 수 계산 (무작위 400개 모두 일치)', parityBad === 0, firstBad)
check('글자 "s"나 한글은 공백으로 세지 않아요 (계산 오류 방지)', countMeaningfulChars('s s s') === 3 && countMeaningfulChars('가 나') === 2)

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
