// "앱이 계산한 EXP · 레벨 · 퀘스트 = 서버(SQL)가 계산한 값"인지 무작위 시나리오로 비교해요.
// 또 "저장 전 EXP 미리보기(predictNewReviewExp) = 서버 트리거가 실제로 정한 값"인지도 비교해요.
// 서버 규칙(SQL)과 화면 규칙(JS)이 어긋나면 사용자가 "100 EXP 받는다더니 아니네?" 하는 일이 생기기 때문이에요.
//
// 실행 (프로젝트 폴더에서):  PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/exp-parity.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { buildGameState, predictNewReviewExp } = await server.ssrLoadModule('/src/utils/gameState.js')

const db = new PGlite()
const read = (file) => fs.readFileSync(path.join(here, file), 'utf8')
await db.exec(read('supabase_stub.sql'))
await db.exec(read('../migrations/0001_schema.sql'))
await db.exec(read('../migrations/0002_rls.sql'))

const admin = async (text, params = []) => (await db.query(text, params)).rows
const asUser = async (userId, text, params = []) => {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`)
  try {
    return { rows: (await db.query(text, params)).rows, error: null }
  } catch (error) {
    return { rows: [], error }
  } finally {
    await db.exec('reset role')
  }
}

// 재현 가능한 난수
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const random = rng(20261014)
const pick = (list) => list[Math.floor(random() * list.length)]

const districts = ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae']
for (let i = 1; i <= 30; i += 1) await admin('insert into public.bakeries (id, name, district_id) values ($1,$2,$3)', [`b${i}`, `빵집${i}`, pick(districts)])

const USERS = 40
let expMismatch = 0
let flagMismatch = 0
let levelMismatch = 0
let statMismatch = 0
let insertsChecked = 0
const details = []

for (let u = 0; u < USERS; u += 1) {
  const userId = `00000000-0000-0000-0000-${String(u + 1).padStart(12, '0')}`
  await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1,$2,now(),$3)`, [userId, `u${u}@t.dev`, JSON.stringify({ nickname: `유저${u}` })])

  const reviewCount = Math.floor(random() * 14)
  const bakeryIds = Array.from({ length: 30 }, (_, i) => `b${i + 1}`).sort(() => random() - 0.5).slice(0, reviewCount)
  for (const bakeryId of bakeryIds) {
    // 지금까지의 내 리뷰로 "이번 저장의 EXP"를 미리 계산 (화면의 미리보기와 같은 함수)
    const mine = (await asUser(userId, `select bakery_id, exp_review, exp_photo, photo_path, created_at, user_id from public.reviews where user_id=$1`, [userId])).rows
    const asReviews = mine.map((row) => ({ expReview: row.exp_review, expPhoto: row.exp_photo, photo: row.photo_path, createdAt: new Date(row.created_at).toISOString() }))
    const hasPhoto = random() < 0.4
    const predicted = predictNewReviewExp(asReviews, { hasPhoto })

    const insert = await asUser(
      userId,
      `insert into public.reviews (bakery_id, rating, content, photo_path) values ($1, 4, '내용', $2) returning exp_review, exp_photo`,
      [bakeryId, hasPhoto ? `${userId}/${bakeryId}.jpg` : null],
    )
    if (insert.error) {
      // 하루 작성 상한(20개)은 이 시나리오에서 안 넘지만, 넘으면 JS도 limitReached로 알려줘야 해요
      if (!(predicted.limitReached && /DAILY_REVIEW_LIMIT/.test(insert.error.message))) details.push(`insert 실패: ${insert.error.message}`)
      continue
    }
    insertsChecked += 1
    const actual = insert.rows[0]
    if (actual.exp_review !== predicted.expReview || actual.exp_photo !== predicted.expPhoto) {
      flagMismatch += 1
      details.push(`미리보기 ≠ 서버 (user ${u}, ${bakeryId}): 예상 ${JSON.stringify({ r: predicted.expReview, p: predicted.expPhoto })} / 서버 ${JSON.stringify(actual)}`)
    }
    // 가끔 작성일을 1~2일 전으로 돌려서(서버 시계 흉내) 하루 상한이 날짜별로 따로 적용되는지 본다
    if (random() < 0.45) {
      // 작성일 변경은 서버의 "고칠 수 없는 칸" 보호 트리거가 막으므로, 시험에서만 잠깐 꺼요
      await db.exec('alter table public.reviews disable trigger reviews_before_update')
      await admin(`update public.reviews set created_at = created_at - ($1 || ' days')::interval where user_id=$2 and bakery_id=$3`, [String(1 + Math.floor(random() * 2)), userId, bakeryId])
      await db.exec('alter table public.reviews enable trigger reviews_before_update')
    }
  }

  // 사진을 지우거나 일부 리뷰를 삭제해도 EXP 계산이 같은지
  if (random() < 0.5) await asUser(userId, `update public.reviews set photo_path = null where user_id=$1 and photo_path is not null and random() < 0.5`, [userId])
  if (random() < 0.5) await asUser(userId, `delete from public.reviews where user_id=$1 and random() < 0.3`, [userId])

  // ── 서버 값 vs 앱 계산 ──
  const rows = (
    await asUser(
      userId,
      `select r.bakery_id, r.photo_path, r.exp_review, r.exp_photo, r.created_at, b.district_id from public.reviews r join public.bakeries b on b.id = r.bakery_id where r.user_id=$1`,
      [userId],
    )
  ).rows
  const reviews = rows.map((row) => ({
    bakeryId: row.bakery_id,
    bakerySource: 'kakao',
    districtId: row.district_id,
    photo: row.photo_path,
    expReview: row.exp_review,
    expPhoto: row.exp_photo,
    createdAt: new Date(row.created_at).toISOString(),
  }))
  const js = buildGameState(reviews)
  const sql = (await asUser(userId, `select exp, level_index, review_count, discovered_count, exp_review_count, quest_bakery_count, quest_district_count from public.user_progress where user_id=$1`, [userId])).rows[0]

  if (Number(sql.exp) !== js.exp) {
    expMismatch += 1
    details.push(`EXP 불일치 (user ${u}): 서버 ${sql.exp} / 앱 ${js.exp}`)
  }
  if (Number(sql.level_index) !== js.progress.currentIndex) {
    levelMismatch += 1
    details.push(`레벨 불일치 (user ${u}): 서버 ${sql.level_index} / 앱 ${js.progress.currentIndex}`)
  }
  const sameStats =
    Number(sql.review_count) === js.stats.allReviewCount &&
    Number(sql.discovered_count) === js.stats.discoveredBakeryIds.size &&
    Number(sql.exp_review_count) === js.stats.reviewCount &&
    Number(sql.quest_bakery_count) === js.stats.bakeryCount &&
    Number(sql.quest_district_count) === js.stats.districtCount
  if (!sameStats) {
    statMismatch += 1
    details.push(`통계 불일치 (user ${u}): 서버 ${JSON.stringify(sql)} / 앱 ${JSON.stringify({ all: js.stats.allReviewCount, disc: js.stats.discoveredBakeryIds.size, exp: js.stats.reviewCount, b: js.stats.bakeryCount, d: js.stats.districtCount })}`)
  }
}

await server.close()
console.log(`사용자 ${USERS}명 · 저장 ${insertsChecked}건 비교`)
console.log(`${flagMismatch === 0 ? '✅' : '❌'} 저장 전 미리보기 = 서버가 정한 EXP 여부 (불일치 ${flagMismatch})`)
console.log(`${expMismatch === 0 ? '✅' : '❌'} 앱 계산 EXP = 서버 EXP (불일치 ${expMismatch})`)
console.log(`${levelMismatch === 0 ? '✅' : '❌'} 앱 레벨 = 서버 레벨 (불일치 ${levelMismatch})`)
console.log(`${statMismatch === 0 ? '✅' : '❌'} 일지 · 도감 · 퀘스트 통계 일치 (불일치 ${statMismatch})`)
if (details.length) console.log(details.slice(0, 10).join('\n'))
process.exit(details.length === 0 && insertsChecked > 100 ? 0 : 1)
