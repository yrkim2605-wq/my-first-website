// 서버 함수(register-bakery)가 쓰는 service_role 권한(0007) 검증.
//  1) 0007 적용 전: 실제 서버에서 난 오류(42501, bakeries 읽기 불가)를 그대로 재현
//  2) 0007 적용 후: 함수가 하는 일(조회 · 등록 · 같은 ID 재등록)만 되고, 그 밖에는 아무것도 안 돼요 (최소 권한)
//  3) RLS · 사용자(anon/authenticated) 권한은 그대로
//  4) 빵집 등록 → 일지 저장 → EXP 지급이 DB 수준에서 이어지는지
//  5) 앱이 쓰는 모든 표 · 뷰 · 함수에 필요한 권한이 빠짐없이 있는지 (다른 표에서 같은 문제가 없는지)
// PGlite(진짜 Postgres)로 실행해요.
//   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/service-role.test.mjs

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
for (const file of ['0001_schema', '0002_rls', '0004_community', '0005_rankings', '0006_review_content']) await db.exec(sql(`../migrations/${file}.sql`))
const GRANTS_SQL = sql('../migrations/0007_service_role_grants.sql')

// 역할로 실행: asRole('service_role') / asRole('authenticated', userId) / asRole('anon')
const asRole = (role, userId = '') => ({
  async q(text, params = []) {
    await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub', '${userId}', false);`)
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
const service = asRole('service_role')

// register-bakery가 보내는 SQL과 같은 모양 (PostgREST의 select / upsert)
const SELECT_SQL = `select id from public.bakeries where id = $1`
const UPSERT_SQL = `insert into public.bakeries (id, name, district_id, address, lat, lng) values ($1, $2, $3, $4, $5, $6)
  on conflict (id) do update set id = excluded.id, name = excluded.name, district_id = excluded.district_id, address = excluded.address, lat = excluded.lat, lng = excluded.lng`

// ── 1. 0007 적용 전: 실제 서버 오류 재현 ──
{
  const before = await service.q(SELECT_SQL, ['12345678'])
  check('적용 전: service_role이 bakeries를 읽으면 42501 (실제 서버에서 난 오류와 같아요)', before.error?.code === '42501' && /permission denied for table bakeries/.test(before.error.message), before.error?.message)
  const write = await service.q(UPSERT_SQL, ['12345678', '시험빵집', 'seomyeon', '부산', 35.1, 129.0])
  check('적용 전: 등록(upsert)도 42501', write.error?.code === '42501', write.error?.message)
}

const policiesBefore = JSON.stringify(await admin(`select tablename, policyname, cmd, roles::text r, qual, with_check from pg_policies where schemaname = 'public' order by tablename, policyname`))
const appGrantsBefore = JSON.stringify(
  await admin(`select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon','authenticated') order by 1,2,3`),
)

// ── 2. 0007 적용 (두 번 실행해도 안전) ──
let applyError = null
try {
  await db.exec(GRANTS_SQL)
  await db.exec(GRANTS_SQL)
} catch (error) {
  applyError = error
}
check('0007을 두 번 실행해도 오류 없음', applyError === null, applyError?.message)

// ── 3. 함수가 하는 일은 돼요 ──
{
  const read = await service.q(SELECT_SQL, ['12345678'])
  check('적용 후: 등록된 빵집인지 조회 (없는 ID → 0줄)', read.error === null && read.rows.length === 0, read.error?.message)
  const insert = await service.q(UPSERT_SQL, ['12345678', '시험빵집', 'seomyeon', '부산 서구 1', 35.1579, 129.0594])
  check('적용 후: 새 빵집 등록 (upsert의 insert)', insert.error === null, insert.error?.message)
  const registeredAt = (await admin(`select registered_at from public.bakeries where id = '12345678'`))[0].registered_at
  const again = await service.q(UPSERT_SQL, ['12345678', '이름이 바뀐 시험빵집', 'seomyeon', '부산 서구 2', 35.158, 129.0595])
  check('적용 후: 같은 ID 재등록 (upsert의 update)', again.error === null, again.error?.message)
  const row = (await admin(`select name, address, registered_at from public.bakeries where id = '12345678'`))[0]
  check('재등록은 값을 갱신하고 등록 시각(registered_at)은 그대로 둬요', row.name === '이름이 바뀐 시험빵집' && row.address === '부산 서구 2' && String(row.registered_at) === String(registeredAt))
  check('조회 → 이제 1줄', (await service.q(SELECT_SQL, ['12345678'])).rows.length === 1)
}

// ── 4. 최소 권한: 그 밖의 것은 모두 거부 ──
{
  const denied = async (label, text, params = []) => {
    const r = await service.q(text, params)
    check(`service_role 거부: ${label}`, r.error?.code === '42501', r.error ? `${r.error.code} ${r.error.message}` : '실행됨')
  }
  await denied('bakeries 삭제', `delete from public.bakeries where id = '12345678'`)
  await denied('bakeries 비우기', `truncate public.bakeries`)
  await denied('registered_at 칸 수정', `update public.bakeries set registered_at = now() where id = '12345678'`)
  await denied('reviews 읽기', `select * from public.reviews`)
  await denied('reviews 쓰기', `insert into public.reviews (bakery_id, rating, content) values ('12345678', 5, 'x')`)
  await denied('profiles 읽기', `select * from public.profiles`)
  await denied('posts 읽기', `select * from public.posts`)
  await denied('bakery_visits 읽기', `select * from public.bakery_visits`)
  await denied('game_settings 쓰기', `update public.game_settings set value = 9999`)
  await denied('랭킹 뷰 읽기', `select * from public.ranking_exp`)

  const tableGrants = await admin(`select table_name, privilege_type from information_schema.role_table_grants where table_schema = 'public' and grantee = 'service_role' order by 1,2`)
  check('service_role의 표 단위 권한은 bakeries SELECT 하나뿐', JSON.stringify(tableGrants) === JSON.stringify([{ table_name: 'bakeries', privilege_type: 'SELECT' }]), JSON.stringify(tableGrants))
  const columnGrants = await admin(`select table_name, column_name, privilege_type from information_schema.column_privileges where table_schema = 'public' and grantee = 'service_role' and privilege_type <> 'SELECT' order by 3,2`)
  const columns = ['address', 'district_id', 'id', 'lat', 'lng', 'name']
  check(
    'service_role의 칸 단위 권한은 bakeries의 6개 칸 INSERT / UPDATE뿐 (registered_at 제외)',
    columnGrants.length === 12 &&
      columnGrants.every((g) => g.table_name === 'bakeries') &&
      JSON.stringify(columnGrants.filter((g) => g.privilege_type === 'INSERT').map((g) => g.column_name)) === JSON.stringify(columns) &&
      JSON.stringify(columnGrants.filter((g) => g.privilege_type === 'UPDATE').map((g) => g.column_name)) === JSON.stringify(columns),
    JSON.stringify(columnGrants),
  )
}

// ── 5. RLS와 사용자 권한은 그대로 ──
{
  const policiesAfter = JSON.stringify(await admin(`select tablename, policyname, cmd, roles::text r, qual, with_check from pg_policies where schemaname = 'public' order by tablename, policyname`))
  check('RLS 정책이 하나도 바뀌지 않았어요', policiesBefore === policiesAfter)
  const appGrantsAfter = JSON.stringify(
    await admin(`select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon','authenticated') order by 1,2,3`),
  )
  check('anon / authenticated의 표 권한이 하나도 바뀌지 않았어요', appGrantsBefore === appGrantsAfter)
  const rls = await admin(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`)
  check('모든 표의 RLS가 켜져 있어요', rls.every((r) => r.relrowsecurity === true), JSON.stringify(rls.filter((r) => !r.relrowsecurity)))
  const A = '00000000-0000-0000-0000-00000000000a'
  await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'a@test.dev', now(), '{"nickname":"시험A"}')`, [A])
  const userInsert = await asRole('authenticated', A).q(`insert into public.bakeries (id, name, district_id) values ('999', '몰래등록', 'seomyeon')`)
  check('로그인한 사용자도 빵집을 직접 등록할 수 없어요', userInsert.error !== null)
  const anonInsert = await asRole('anon').q(`insert into public.bakeries (id, name, district_id) values ('998', '몰래등록', 'seomyeon')`)
  check('비로그인은 빵집을 등록할 수 없어요', anonInsert.error !== null)
  check('사용자는 빵집을 읽을 수 있어요', (await asRole('authenticated', A).q(`select id from public.bakeries where id = '12345678'`)).rows.length === 1)
  check('비로그인도 빵집 목록을 읽을 수 있어요 (공개 데이터)', (await asRole('anon').q(`select id from public.bakeries where id = '12345678'`)).rows.length === 1)

  // ── 6. 실제 흐름: 함수가 등록한 빵집에 일지를 쓰면 EXP가 지급돼요 ──
  const enough = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
  const saved = await asRole('authenticated', A).q(`insert into public.reviews (bakery_id, rating, content) values ('12345678', 5, $1) returning exp_review, bakery_id`, [enough])
  check('등록된 빵집에 일지 저장 → EXP 대상(exp_review=true)', saved.error === null && saved.rows[0].exp_review === true, saved.error?.message)
  const progress = (await asRole('authenticated', A).q(`select exp, level_index, review_count from public.user_progress where user_id = $1`, [A])).rows[0]
  check('EXP = 일지 30 + 첫 일지 퀘스트 20 = 50, 일지 1개', progress.exp === 50 && progress.review_count === 1, JSON.stringify(progress))
  const unregistered = await asRole('authenticated', A).q(`insert into public.reviews (bakery_id, rating, content) values ('77777777', 5, $1)`, [enough])
  check('함수가 등록하지 않은 빵집에는 일지를 쓸 수 없어요 (EXP 부정 방지 유지)', unregistered.error !== null)
}

// ── 7. 다른 표에서도 같은 문제가 없는지: 앱이 쓰는 권한이 빠짐없이 있는지 ──
{
  const tables = ['profiles', 'bakeries', 'reviews', 'posts', 'comments', 'post_likes', 'game_settings']
  const views = ['user_stats', 'user_progress', 'leaderboard', 'post_feed', 'comment_feed', 'ranking_exp', 'ranking_monthly_reviews', 'ranking_bakeries', 'ranking_posts']
  const functions = ['is_email_verified()', 'is_nickname_available(text)', 'game_setting(text)', 'game_exp(int,int,int,int)', 'game_level_index(int)', 'review_meaningful_length(text)']
  const privilege = async (sqlText, params) => (await admin(sqlText, params))[0].ok
  const missing = []
  for (const role of ['anon', 'authenticated']) {
    for (const name of [...tables, ...views]) {
      if (!(await privilege(`select has_table_privilege($1, $2, 'SELECT') ok`, [role, `public.${name}`]))) missing.push(`${role} SELECT ${name}`)
    }
    for (const fn of functions) {
      if (!(await privilege(`select has_function_privilege($1, $2, 'EXECUTE') ok`, [role, `public.${fn}`]))) missing.push(`${role} EXECUTE ${fn}`)
    }
    if (!(await privilege(`select has_schema_privilege($1, 'public', 'USAGE') ok`, [role]))) missing.push(`${role} USAGE schema public`)
  }
  // 로그인한 사용자만 쓰는 것들
  const authWrites = [
    ['bakery_visits', 'SELECT'],
    ['reviews', 'DELETE'],
    ['posts', 'DELETE'],
    ['comments', 'DELETE'],
    ['post_likes', 'DELETE'],
    ['bakery_visits', 'DELETE'],
  ]
  for (const [table, p] of authWrites) {
    if (!(await privilege(`select has_table_privilege('authenticated', $1, $2) ok`, [`public.${table}`, p]))) missing.push(`authenticated ${p} ${table}`)
  }
  const authColumns = [
    ['profiles', 'nickname', 'UPDATE'],
    ['reviews', 'bakery_id', 'INSERT'], ['reviews', 'rating', 'INSERT'], ['reviews', 'content', 'INSERT'], ['reviews', 'photo_path', 'INSERT'],
    ['reviews', 'rating', 'UPDATE'], ['reviews', 'content', 'UPDATE'], ['reviews', 'photo_path', 'UPDATE'],
    ['posts', 'category_id', 'INSERT'], ['posts', 'title', 'INSERT'], ['posts', 'content', 'INSERT'], ['posts', 'title', 'UPDATE'], ['posts', 'content', 'UPDATE'],
    ['comments', 'post_id', 'INSERT'], ['comments', 'parent_id', 'INSERT'], ['comments', 'content', 'INSERT'],
    ['post_likes', 'post_id', 'INSERT'], ['bakery_visits', 'bakery_id', 'INSERT'],
  ]
  for (const [table, column, p] of authColumns) {
    if (!(await privilege(`select has_column_privilege('authenticated', $1, $2, $3) ok`, [`public.${table}`, column, p]))) missing.push(`authenticated ${p} ${table}.${column}`)
  }
  check('앱이 쓰는 표 · 뷰 · 함수 · 칸의 권한이 anon / authenticated에 빠짐없이 있어요', missing.length === 0, missing.join(' / '))

  // 서버가 정하는 값은 사용자가 쓸 수 없어요 (권한을 주지 않은 칸)
  const forbidden = []
  for (const [table, column, p] of [['reviews', 'exp_review', 'INSERT'], ['reviews', 'exp_review', 'UPDATE'], ['reviews', 'exp_photo', 'INSERT'], ['reviews', 'user_id', 'INSERT'], ['reviews', 'created_at', 'UPDATE'], ['posts', 'user_id', 'INSERT'], ['bakeries', 'name', 'INSERT'], ['game_settings', 'value', 'UPDATE']]) {
    if (await privilege(`select has_column_privilege('authenticated', $1, $2, $3) ok`, [`public.${table}`, column, p])) forbidden.push(`${p} ${table}.${column}`)
  }
  check('사용자에게 주면 안 되는 칸(EXP · 작성자 · 날짜 · 빵집 등록 · 설정)은 여전히 막혀 있어요', forbidden.length === 0, forbidden.join(' / '))
  check('비로그인은 방문 체크(나만 보는 기록)를 읽을 수 없어요', !(await privilege(`select has_table_privilege('anon', 'public.bakery_visits', 'SELECT') ok`)))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
