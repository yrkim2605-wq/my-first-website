// 사진 저장소(Storage) 보안 정책(0003) + 게시글 사진 경로(posts.photo_path) 검증.
//  - 다른 사용자는 사진을 볼 수 있지만(공개 버킷), 올리기 · 교체 · 삭제는 작성자(내 폴더)만 가능한지
//  - 사진 크기(1MB) · 허용 형식(JPEG/WebP)이 버킷 설정에 들어 있는지, 앱 사용자가 이 설정을 못 바꾸는지
//  - 게시글의 사진 경로는 내 폴더만 가리킬 수 있고, 남의 글 사진은 바꿀 수 없는지
// PGlite(진짜 Postgres)로 실행해요.   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/storage-policy.test.mjs

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
for (const file of ['../migrations/0001_schema.sql', '../migrations/0002_rls.sql', 'storage_stub.sql', '../migrations/0003_storage.sql', '../migrations/0004_community.sql']) await db.exec(sql(file))

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

const [A, B, C] = ['a', 'b', 'c'].map((x) => `00000000-0000-0000-0000-00000000040${x === 'a' ? 1 : x === 'b' ? 2 : 3}`)
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'a@test.dev', now(), '{"nickname":"사진A"}')`, [A])
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'b@test.dev', now(), '{"nickname":"사진B"}')`, [B])
await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'c@test.dev', null, '{"nickname":"미인증C"}')`, [C])

// ── 1. 버킷 설정 (크기 · 형식 · 공개) ──
{
  const bucket = (await admin(`select id, public, file_size_limit::int size, allowed_mime_types types from storage.buckets where id = 'photos'`))[0]
  check('photos 버킷: 공개(누구나 사진 보기), 1MB 제한, JPEG/WebP만', bucket.public === true && bucket.size === 1048576 && JSON.stringify(bucket.types) === '["image/jpeg","image/webp"]', JSON.stringify(bucket))
  check('앱 사용자는 버킷 설정을 읽을 수 없어요', (await as(A).q('select * from storage.buckets')).rows.length === 0)
  check('앱 사용자는 버킷 설정(크기 · 형식 · 공개 여부)을 바꿀 수 없어요', (await as(A).q(`update storage.buckets set file_size_limit = 999999999, allowed_mime_types = null where id = 'photos' returning id`)).rows.length === 0
    && (await admin(`select file_size_limit::int s from storage.buckets where id='photos'`))[0].s === 1048576)
  check('앱 사용자는 새 버킷을 만들거나 지울 수 없어요', (await as(A).q(`insert into storage.buckets (id, name, public) values ('evil', 'evil', true)`)).error !== null
    && (await as(A).q(`delete from storage.buckets where id = 'photos' returning id`)).rows.length === 0)
}

// ── 2. 올리기 · 교체 · 삭제는 내 폴더만 ──
// RETURNING 없이 넣어요: 사진 저장소는 읽기를 공개 주소로 처리해서 읽기 정책이 없고, RETURNING은 읽기 정책도 요구하기 때문이에요. 결과는 관리자 권한으로 확인해요.
const put = (user, name, bucket = 'photos') => as(user).q('insert into storage.objects (bucket_id, name) values ($1, $2)', [bucket, name])
const exists = async (name) => (await admin('select count(*)::int n from storage.objects where name = $1', [name]))[0].n === 1
{
  const mine = await put(A, `${A}/photo-1.jpg`)
  check('작성자(A)는 자기 폴더에 사진을 올릴 수 있어요', mine.error === null && (await exists(`${A}/photo-1.jpg`)), mine.error?.message)
  check('A가 B의 폴더에 올리는 것은 거부', (await put(A, `${B}/hack.jpg`)).error !== null && !(await exists(`${B}/hack.jpg`)))
  check('A가 폴더 없이(맨 위) 올리는 것은 거부', (await put(A, 'loose.jpg')).error !== null)
  check('A가 다른 사람 폴더 이름을 흉내 낸 하위 경로도 거부', (await put(A, `x/${A}/photo.jpg`)).error !== null)
  check('A가 다른 버킷에 올리는 것은 거부', (await put(A, `${A}/photo.jpg`, 'other')).error !== null)
  check('비로그인은 올릴 수 없어요', (await put(null, `${A}/anon.jpg`)).error !== null)
  check('이메일 미인증 사용자는 자기 폴더에도 올릴 수 없어요', (await put(C, `${C}/photo.jpg`)).error !== null)
}

// 0003만 적용된 상태(지금 서버): 작성자도 자기 사진을 지우지 못하고, 오류 없이 0건만 처리돼요 (조용한 실패)
const target = (await admin('select id from storage.objects where name = $1', [`${A}/photo-1.jpg`]))[0].id
{
  const del = await as(A).q('delete from storage.objects where id = $1 returning id', [target])
  check('[0003만 적용] 작성자도 자기 사진 삭제가 오류 없이 0건 처리돼요 (읽기 정책이 없어서) — 파일이 남는 문제', del.error === null && del.rows.length === 0 && (await exists(`${A}/photo-1.jpg`)))
}

// 0008 적용: 내 폴더 읽기 정책 추가 (두 번 실행해도 안전)
const SELECT_POLICY_SQL = sql('../migrations/0008_storage_select_own.sql')
{
  let applyError = null
  try {
    await db.exec(SELECT_POLICY_SQL)
    await db.exec(SELECT_POLICY_SQL)
  } catch (error) {
    applyError = error
  }
  check('0008을 두 번 실행해도 오류 없음', applyError === null, applyError?.message)
  const policies = (await admin("select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname")).map((p) => `${p.policyname}:${p.cmd}`)
  check('정책: 올리기 · 고치기 · 지우기(0003) + 내 폴더 읽기(0008)뿐이에요', JSON.stringify(policies) === JSON.stringify(['photos_delete_own:DELETE', 'photos_insert_own:INSERT', 'photos_select_own:SELECT', 'photos_update_own:UPDATE']), JSON.stringify(policies))
}
{
  check('A는 자기 폴더의 파일 목록을 읽을 수 있어요', (await as(A).q('select name from storage.objects')).rows.map((r) => r.name).join(',') === `${A}/photo-1.jpg`)
  check('B는 A의 파일 목록을 볼 수 없어요 (0행)', (await as(B).q('select * from storage.objects')).rows.length === 0)
  check('비로그인은 파일 목록을 볼 수 없어요', (await as(null).q('select * from storage.objects')).rows.length === 0)
  check('이메일 미인증 사용자는 여전히 올릴 수 없어요', (await put(C, `${C}/photo.jpg`)).error !== null)

  check('B는 A의 사진을 교체(수정)할 수 없어요 (0행)', (await as(B).q('update storage.objects set name = $2 where id = $1 returning id', [target, `${B}/stolen.jpg`])).rows.length === 0)
  check('B는 A의 사진을 지울 수 없어요 (0행)', (await as(B).q('delete from storage.objects where id = $1 returning id', [target])).rows.length === 0)
  check('비로그인은 사진을 지우거나 바꿀 수 없어요', (await as(null).q('delete from storage.objects where id = $1 returning id', [target])).rows.length === 0 && (await as(null).q("update storage.objects set name = 'x' where id = $1 returning id", [target])).rows.length === 0)
  check('A는 자기 사진을 다른 사람 폴더로 옮길 수 없어요', (await as(A).q('update storage.objects set name = $2 where id = $1', [target, `${B}/moved.jpg`])).error !== null && (await exists(`${A}/photo-1.jpg`)))
  check('A는 자기 사진을 내 폴더 안에서 교체(이름 변경)할 수 있어요', (await as(A).q('update storage.objects set name = $2 where id = $1 returning id', [target, `${A}/photo-1b.jpg`])).rows.length === 1)
  check('[0008 적용] A는 자기 사진을 지울 수 있어요 (이제 실제로 1건 지워져요)', (await as(A).q('delete from storage.objects where id = $1 returning id', [target])).rows.length === 1 && !(await exists(`${A}/photo-1b.jpg`)))
  check('B는 자기 폴더의 파일을 올리고 지울 수 있어요', (await put(B, `${B}/mine.jpg`)).error === null && (await as(B).q("delete from storage.objects where name = $1 returning id", [`${B}/mine.jpg`])).rows.length === 1)
}

// ── 3. 게시글의 사진 경로 ──
{
  const mkPost = (user, photoPath) => as(user).q(`insert into public.posts (category_id, title, content, photo_path) values ('photo', '사진 글', '내용', $1) returning id`, [photoPath])
  const withPhoto = await mkPost(A, `${A}/post-photo.jpg`)
  check('내 폴더 사진 경로를 단 글을 쓸 수 있어요', withPhoto.error === null && withPhoto.rows.length === 1, withPhoto.error?.message)
  check('남의 폴더 사진 경로를 단 글은 거부', (await mkPost(A, `${B}/post-photo.jpg`)).error !== null)
  check('사진 없는 글(photo_path 비움)도 그대로 쓸 수 있어요', (await mkPost(A, null)).error === null)
  const postId = withPhoto.rows[0].id
  check('다른 사용자(비로그인 포함)도 글의 사진 경로를 읽을 수 있어요 (그래서 공개 주소로 사진을 봐요)', (await as(B).q(`select photo_path from public.post_feed where id = $1`, [postId])).rows[0].photo_path === `${A}/post-photo.jpg`
    && (await as(null).q(`select photo_path from public.post_feed where id = $1`, [postId])).rows[0].photo_path === `${A}/post-photo.jpg`)
  check('B는 A의 글에 달린 사진을 바꾸거나 뺄 수 없어요 (0행)', (await as(B).q(`update public.posts set photo_path = null where id = $1 returning id`, [postId])).rows.length === 0
    && (await as(B).q(`update public.posts set photo_path = $2 where id = $1 returning id`, [postId, `${B}/mine.jpg`])).rows.length === 0)
  check('비로그인은 글의 사진을 바꿀 수 없어요', (await as(null).q(`update public.posts set photo_path = null where id = $1 returning id`, [postId])).rows.length === 0)
  check('A는 자기 글의 사진을 다른 내 사진으로 교체할 수 있어요', (await as(A).q(`update public.posts set photo_path = $2 where id = $1 returning photo_path`, [postId, `${A}/post-photo-2.jpg`])).rows[0]?.photo_path === `${A}/post-photo-2.jpg`)
  check('A가 자기 글의 사진 경로를 남의 폴더로 바꾸는 것은 거부', (await as(A).q(`update public.posts set photo_path = $2 where id = $1`, [postId, `${B}/steal.jpg`])).error !== null)
  check('A는 자기 글의 사진을 뺄 수 있어요', (await as(A).q(`update public.posts set photo_path = null where id = $1 returning photo_path`, [postId])).rows[0]?.photo_path === null)
  check('B는 A의 글을 지울 수 없어요 (사진 경로가 남아 있어도)', (await as(B).q(`delete from public.posts where id = $1 returning id`, [postId])).rows.length === 0)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
