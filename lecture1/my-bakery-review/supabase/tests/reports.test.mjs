// 신고 + 운영자(0009 · 0010) 보안 검증. PGlite(진짜 Postgres)로 실행해요.
//   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/reports.test.mjs
//
// 확인하는 것
//  1) 신고자가 쓸 수 있는 칸(4칸)과 서버가 정하는 값(신고자 · 상태 · 작성자 · 내용)
//  2) 검사 규칙: 비로그인 · 미인증 · 없는 대상 · 내 글 · 중복 · 하루 20건
//  3) 읽기: 신고자는 자기 신고만, 운영자는 전체, 그 외에는 없음
//  4) 일반 사용자가 운영자가 되거나, 신고를 고치거나, 처리 함수를 쓰는 길이 없는지
//  5) 운영자 처리(반려 · 삭제) + 사진 파일 정리 권한(0010)
//  6) 신고자 탈퇴 시 신고 기록 보존

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)

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
for (const file of [
  '../migrations/0001_schema.sql',
  '../migrations/0002_rls.sql',
  'storage_stub.sql',
  '../migrations/0003_storage.sql',
  '../migrations/0004_community.sql',
  '../migrations/0006_review_content.sql',
  '../migrations/0008_storage_select_own.sql',
  '../migrations/0009_reports.sql',
  '../migrations/0010_storage_admin.sql',
]) {
  await db.exec(sql(file))
}
// 여러 번 실행해도 안전한지 (마이그레이션 재실행)
let rerunError = null
try {
  await db.exec(sql('../migrations/0009_reports.sql'))
  await db.exec(sql('../migrations/0010_storage_admin.sql'))
} catch (error) {
  rerunError = error
}
check('0009 · 0010을 다시 실행해도 오류가 없어요', rerunError === null, rerunError?.message)

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
const root = async (text, params = []) => (await db.query(text, params)).rows

const id = (n) => `00000000-0000-0000-0000-0000000009${String(n).padStart(2, '0')}`
const [A, B, C, ADMIN, D] = [1, 2, 3, 4, 5].map(id) // A 신고자 · B 작성자 · C 미인증 · ADMIN 운영자 · D 다른 일반 사용자
const users = [
  [A, 'a', '신고A', true],
  [B, 'b', '작성B', true],
  [C, 'c', '미인증C', false],
  [ADMIN, 'adm', '운영자', true],
  [D, 'd', '일반D', true],
]
for (const [uid, mail, nick, verified] of users) {
  await root(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, ${verified ? 'now()' : 'null'}, $3)`, [uid, `${mail}@test.dev`, JSON.stringify({ nickname: nick })])
}
await root(`insert into public.admins (user_id) values ($1)`, [ADMIN]) // 운영자는 서버(SQL Editor)에서만 등록해요
await root(`insert into public.bakeries (id, name, district_id) values ('k1', '테스트빵집', 'haeundae')`)

// B가 쓴 글 · 댓글 · 리뷰 (사진 포함)
const post = (await as(B).q(`insert into public.posts (category_id, title, content, photo_path) values ('recommend', '문제의 글', '이 글은 신고될 거예요', $1) returning id`, [`${B}/p1.jpg`])).rows[0].id
const comment = (await as(B).q(`insert into public.comments (post_id, content) values ($1, '문제의 댓글') returning id`, [post])).rows[0].id
const review = (await as(B).q(`insert into public.reviews (bakery_id, rating, content, photo_path) values ('k1', 4, '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다', $1) returning id`, [`${B}/r1.jpg`])).rows[0].id
await root(`insert into storage.objects (bucket_id, name, owner) values ('photos', $1, $2), ('photos', $3, $2)`, [`${B}/p1.jpg`, B, `${B}/r1.jpg`])

const report = (user, type, targetId, reason = 'spam', detail = null) =>
  as(user).q(`insert into public.reports (target_type, target_id, reason, detail) values ($1, $2, $3, $4) returning id, reporter_id, status, target_user_id, target_snapshot, target_context`, [type, targetId, reason, detail])

// ── 1. 정상 신고 + 서버가 정하는 값 ──
{
  const result = await report(A, 'post', post, 'abuse', '  욕설이 있어요  ')
  const row = result.rows[0]
  check('A가 B의 글을 신고할 수 있어요', result.error === null && row, result.error?.message)
  check('신고자는 서버가 로그인 사용자(A)로 정해요', row?.reporter_id === A)
  check('상태는 항상 open', row?.status === 'open')
  check('서버가 작성자(B) · 내용 일부 · 이동 정보를 채워요', row?.target_user_id === B && row.target_snapshot.includes('문제의 글') && row.target_snapshot.includes('신고될 거예요') && row.target_context === null)
  check('상세 앞뒤 공백은 정리돼요', (await root(`select detail from public.reports where id = $1`, [row.id]))[0].detail === '욕설이 있어요')
}
{
  const c = await report(A, 'comment', comment, 'spam')
  check('댓글 신고: 이동 정보에 글 id가 들어가요', c.rows[0]?.target_context === post)
  const r = await report(A, 'review', review, 'privacy')
  check('리뷰 신고: 이동 정보에 빵집 id가 들어가요', r.rows[0]?.target_context === 'k1')
}

// ── 2. 클라이언트가 값을 속이려는 시도 ──
{
  const spoof = (cols, vals) => as(A).q(`insert into public.reports (target_type, target_id, reason, ${cols}) values ('post', $1, 'spam', ${vals})`, [post])
  const asOther = await spoof('reporter_id', `'${D}'`)
  check('신고자 칸(reporter_id)을 직접 쓸 수 없어요', asOther.error !== null)
  const asStatus = await spoof('status', `'resolved'`)
  check('상태(status)를 직접 쓸 수 없어요', asStatus.error !== null)
  const asHandled = await spoof('handled_by', `'${ADMIN}'`)
  check('처리자(handled_by)를 직접 쓸 수 없어요', asHandled.error !== null)
  const asSnap = await spoof('target_snapshot', `'가짜 내용'`)
  check('내용(target_snapshot)을 직접 쓸 수 없어요', asSnap.error !== null)
  const asAuthor = await spoof('target_user_id', `'${D}'`)
  check('작성자(target_user_id)를 직접 쓸 수 없어요', asAuthor.error !== null)
}

// ── 3. 검사 규칙 ──
{
  const anon = await report(null, 'post', post)
  check('비로그인은 신고할 수 없어요', anon.error !== null)
  const unverified = await report(C, 'post', post)
  check('이메일 미인증 사용자는 신고할 수 없어요', unverified.error !== null)
  const own = await report(B, 'post', post)
  check('내 글은 신고할 수 없어요 (OWN_CONTENT)', /OWN_CONTENT/.test(own.error?.message ?? ''), own.error?.message)
  const dup = await report(A, 'post', post)
  check('같은 대상을 두 번 신고할 수 없어요', dup.error?.code === '23505', dup.error?.message)
  const missing = await report(A, 'post', id(99))
  check('없는 대상은 신고할 수 없어요 (TARGET_NOT_FOUND)', /TARGET_NOT_FOUND/.test(missing.error?.message ?? ''), missing.error?.message)
  const badReason = await report(D, 'post', post, 'bogus')
  check('정해진 사유가 아니면 거부', badReason.error !== null)
  const badType = await report(D, 'user', post)
  check('정해진 대상 종류가 아니면 거부', badType.error !== null)
  const longDetail = await report(D, 'post', post, 'other', 'x'.repeat(301))
  check('상세 301자는 거부', longDetail.error !== null)
  const okLong = await report(D, 'post', post, 'other', 'x'.repeat(300))
  check('상세 300자는 통과', okLong.error === null)
}
{
  // 하루 20건 상한: B가 댓글 21개를 달고(댓글 하루 상한 50), D가 신고
  const ids = []
  for (let i = 0; i < 21; i += 1) ids.push((await as(B).q(`insert into public.comments (post_id, content) values ($1, $2) returning id`, [post, `댓글 ${i}`])).rows[0].id)
  // D는 위에서 이미 글 신고 1건 사용 → 19건 더 가능, 20번째 추가분부터 거부
  let accepted = 0
  let blocked = null
  for (const commentId of ids) {
    const result = await report(D, 'comment', commentId)
    if (result.error) {
      blocked = result.error
      break
    }
    accepted += 1
  }
  check('하루 20건까지만 신고할 수 있어요 (DAILY_REPORT_LIMIT)', accepted === 19 && /DAILY_REPORT_LIMIT/.test(blocked?.message ?? ''), `accepted=${accepted} ${blocked?.message}`)
}

// ── 4. 읽기 범위 ──
{
  const mine = (await as(A).q('select id, reporter_id from public.reports')).rows
  check('A는 자기 신고만 볼 수 있어요', mine.length === 3 && mine.every((row) => row.reporter_id === A), String(mine.length))
  check('작성자(B)는 자기 글이 신고됐는지 볼 수 없어요', (await as(B).q('select id from public.reports')).rows.length === 0)
  check('비로그인은 신고를 읽을 수 없어요', (await as(null).q('select id from public.reports')).error !== null)
  const all = (await as(ADMIN).q('select id from public.reports')).rows.length
  const total = (await root('select count(*)::int n from public.reports'))[0].n
  check('운영자는 전체 신고를 볼 수 있어요', all === total && total > 3, `${all}/${total}`)
}

// ── 5. 일반 사용자가 운영자가 되거나 신고를 고치는 길이 없는지 ──
{
  check('일반 사용자는 admins에 자기를 넣을 수 없어요', (await as(A).q(`insert into public.admins (user_id) values ($1)`, [A])).error !== null)
  check('일반 사용자는 admins를 읽을 수 없어요 (누가 운영자인지 모름)', (await as(A).q('select * from public.admins')).error !== null)
  check('운영자 본인도 앱에서 admins를 읽거나 바꿀 수 없어요', (await as(ADMIN).q('select * from public.admins')).error !== null && (await as(ADMIN).q(`insert into public.admins (user_id) values ($1)`, [D])).error !== null)
  check('비로그인은 admins에 아무것도 못 해요', (await as(null).q('select * from public.admins')).error !== null)
  check('is_admin(): 일반 사용자 false · 운영자 true', (await as(A).q('select public.is_admin() v')).rows[0].v === false && (await as(ADMIN).q('select public.is_admin() v')).rows[0].v === true)
  check('is_admin()은 비로그인이 부를 수 없어요', (await as(null).q('select public.is_admin()')).error !== null)

  const own = (await as(A).q('select id from public.reports limit 1')).rows[0].id
  const upd = await as(A).q(`update public.reports set status = 'resolved' where id = $1 returning id`, [own])
  check('신고자가 자기 신고의 상태를 바꿀 수 없어요', upd.error !== null || upd.rows.length === 0)
  const updDetail = await as(A).q(`update public.reports set detail = '수정' where id = $1 returning id`, [own])
  check('신고자가 자기 신고를 고칠 수도 없어요 (수정 권한 없음)', updDetail.error !== null || updDetail.rows.length === 0)
  const del = await as(A).q(`delete from public.reports where id = $1 returning id`, [own])
  check('신고자가 신고를 지울 수 없어요', del.error !== null || del.rows.length === 0)
  check('위 시도 뒤에도 신고가 그대로예요', (await root(`select status from public.reports where id = $1`, [own]))[0].status === 'open')

  const handle = await as(A).q(`select public.admin_handle_report($1, 'remove', null)`, [own])
  check('일반 사용자는 처리 함수를 쓸 수 없어요 (NOT_ADMIN)', /NOT_ADMIN/.test(handle.error?.message ?? ''), handle.error?.message)
  const handleAnon = await as(null).q(`select public.admin_handle_report($1, 'remove', null)`, [own])
  check('비로그인은 처리 함수를 부를 수 없어요', handleAnon.error !== null)
  check('작성자(B)가 자기 글 신고를 처리 함수로 없앨 수 없어요', /NOT_ADMIN/.test((await as(B).q(`select public.admin_handle_report($1, 'dismiss', null)`, [own])).error?.message ?? ''))
}

// ── 6. 운영자 처리 ──
{
  const reportOf = async (type, target) => (await root(`select id from public.reports where target_type = $1 and target_id = $2 order by created_at limit 1`, [type, target]))[0].id
  const postReport = await reportOf('post', post)

  const badAction = await as(ADMIN).q(`select public.admin_handle_report($1, 'ban', null)`, [postReport])
  check('정해진 처리 방법이 아니면 거부 (INVALID_ACTION)', /INVALID_ACTION/.test(badAction.error?.message ?? ''))
  const longNote = await as(ADMIN).q(`select public.admin_handle_report($1, 'dismiss', $2)`, [postReport, 'x'.repeat(301)])
  check('처리 메모 301자는 거부', /NOTE_TOO_LONG/.test(longNote.error?.message ?? ''))
  const missing = await as(ADMIN).q(`select public.admin_handle_report($1, 'dismiss', null)`, [id(98)])
  check('없는 신고는 거부 (REPORT_NOT_FOUND)', /REPORT_NOT_FOUND/.test(missing.error?.message ?? ''))

  // 반려
  const commentReport = await reportOf('comment', comment)
  const dismissed = await as(ADMIN).q(`select public.admin_handle_report($1, 'dismiss', '문제 없음') r`, [commentReport])
  const afterDismiss = (await root(`select status, handled_by, handled_note, handled_at is not null as has_time from public.reports where id = $1`, [commentReport]))[0]
  check('반려: 상태 rejected + 처리자 · 시각 · 메모 기록', dismissed.error === null && afterDismiss.status === 'rejected' && afterDismiss.handled_by === ADMIN && afterDismiss.has_time && afterDismiss.handled_note === '문제 없음', dismissed.error?.message)
  check('반려하면 댓글은 그대로 남아요', (await root('select count(*)::int n from public.comments where id = $1', [comment]))[0].n === 1)
  const again = await as(ADMIN).q(`select public.admin_handle_report($1, 'remove', null)`, [commentReport])
  check('이미 처리한 신고는 다시 처리할 수 없어요 (ALREADY_HANDLED)', /ALREADY_HANDLED/.test(again.error?.message ?? ''))

  // 삭제하고 처리 (글 + 사진 경로 반환, 같은 대상의 다른 신고도 같이 처리)
  const openBefore = (await root(`select count(*)::int n from public.reports where target_type = 'post' and target_id = $1 and status = 'open'`, [post]))[0].n
  const removed = await as(ADMIN).q(`select public.admin_handle_report($1, 'remove', '욕설 확인') r`, [postReport])
  const photoPath = removed.rows[0]?.r?.photo_path
  check('삭제하고 처리: 글이 지워지고 사진 경로를 돌려줘요', removed.error === null && photoPath === `${B}/p1.jpg` && (await root('select count(*)::int n from public.posts where id = $1', [post]))[0].n === 0, removed.error?.message)
  check('같은 글에 대한 열린 신고(여러 건)가 모두 처리돼요', openBefore >= 2 && (await root(`select count(*)::int n from public.reports where target_type = 'post' and target_id = $1 and status = 'open'`, [post]))[0].n === 0, String(openBefore))
  check('글을 지우면 그 글의 댓글도 연쇄로 지워져요 (기존 규칙)', (await root('select count(*)::int n from public.comments where id = $1', [comment]))[0].n === 0)

  // 리뷰 삭제
  const reviewReport = await reportOf('review', review)
  const removedReview = await as(ADMIN).q(`select public.admin_handle_report($1, 'remove', null) r`, [reviewReport])
  check('리뷰 삭제 처리 + 사진 경로 반환', removedReview.error === null && removedReview.rows[0].r.photo_path === `${B}/r1.jpg` && (await root('select count(*)::int n from public.reviews where id = $1', [review]))[0].n === 0)
}

// ── 7. 사진 파일 정리 권한 (0010) ──
{
  const objects = async (user) => (await as(user).q(`select name from storage.objects where bucket_id = 'photos'`)).rows.map((row) => row.name)
  check('운영자는 사진 파일 목록을 볼 수 있어요', (await objects(ADMIN)).includes(`${B}/p1.jpg`))
  check('다른 일반 사용자(D)는 B의 사진 목록을 볼 수 없어요', !(await objects(D)).includes(`${B}/p1.jpg`))
  const nonAdminDelete = await as(D).q(`delete from storage.objects where name = $1 and bucket_id = 'photos' returning name`, [`${B}/p1.jpg`])
  check('일반 사용자는 남의 사진 파일을 지울 수 없어요', nonAdminDelete.rows.length === 0)
  const adminDelete = await as(ADMIN).q(`delete from storage.objects where name = $1 and bucket_id = 'photos' returning name`, [`${B}/p1.jpg`])
  check('운영자는 남의 사진 파일을 지울 수 있어요', adminDelete.rows.length === 1)
  const adminUpload = await as(ADMIN).q(`insert into storage.objects (bucket_id, name) values ('photos', $1)`, [`${B}/planted.jpg`])
  check('운영자도 남의 폴더에 파일을 올릴 수는 없어요', adminUpload.error !== null)
  const adminOther = await as(ADMIN).q(`delete from storage.objects where bucket_id = 'other' returning name`)
  check('운영자의 삭제 권한은 photos 버킷에만 있어요', adminOther.rows.length === 0)
}

// ── 8. 신고자 탈퇴 시 기록 보존 ──
{
  const before = (await root(`select count(*)::int n from public.reports where reporter_id = $1`, [A]))[0].n
  await root('delete from auth.users where id = $1', [A])
  const after = await root(`select count(*)::int total, count(*) filter (where reporter_id is null)::int detached from public.reports where target_snapshot is not null`)
  check('신고자가 탈퇴해도 신고 기록은 남고, 신고자 연결만 끊겨요', before === 3 && after[0].detached >= 3, `${before} ${JSON.stringify(after[0])}`)
  const stillThere = (await root(`select count(*)::int n from public.reports where target_type = 'review'`))[0].n
  check('탈퇴한 신고자의 신고 내용(스냅샷)이 남아 있어요', stillThere >= 1)
}
{
  await root('delete from auth.users where id = $1', [ADMIN])
  check('운영자가 탈퇴하면 운영자 목록에서도 사라져요', (await root('select count(*)::int n from public.admins'))[0].n === 0)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
