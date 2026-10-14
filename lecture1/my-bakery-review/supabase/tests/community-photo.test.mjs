// 게시글 사진(1장) 저장소 검증: 올리기 · 교체 · 삭제 순서, 실패 시 글 보존, 파일 정리와 정리 실패 기록, 형식 · 크기 점검.
// 진짜 서버 대신 가짜 클라이언트를 써요.   실행: node supabase/tests/community-photo.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const shared = await server.ssrLoadModule('/src/storage/supabaseShared.js')
shared.setDebugLogger(() => {})
const { createSupabaseCommunityRepository } = await server.ssrLoadModule('/src/storage/supabaseCommunityRepository.js')
const { listOrphanPhotos, recordOrphanPhoto } = await server.ssrLoadModule('/src/storage/photoStorage.js')

// 쓰기를 기록하는 가짜 localStorage (정리하지 못한 사진 기록용)
const store = {}
const storageLog = { sets: [], removes: [] }
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => (storageLog.sets.push(k), (store[k] = String(v))),
  removeItem: (k) => (storageLog.removes.push(k), delete store[k]),
}

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const rejects = async (promise) => {
  try {
    await promise
    return null
  } catch (error) {
    return error
  }
}

const jpeg = (bytes) => `data:image/jpeg;base64,${Buffer.alloc(bytes, 1).toString('base64')}`
const webp = (bytes) => `data:image/webp;base64,${Buffer.alloc(bytes, 1).toString('base64')}`
const input = { categoryId: 'photo', title: '사진 글', content: '내용' }

const makeFake = (state = {}) => {
  const ops = [] // 호출 순서
  const s = { session: { user: { id: 'me' } }, currentPhoto: 'me/old.jpg', ...state }
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null, mode: 'list' }
    const finish = async () => {
      ops.push(`db:${table}:${q.op}`)
      if (s.dbError?.[`${table}:${q.op}`]) return { data: null, error: s.dbError[`${table}:${q.op}`] }
      if (q.table === 'posts' && q.op === 'select') return { data: s.currentPost === undefined ? { photo_path: s.currentPhoto } : s.currentPost, error: null }
      if (q.table === 'posts' && q.op === 'insert') return { data: { id: 'new-post' }, error: null }
      if (q.table === 'posts' && q.op === 'update') return { data: s.updateRows ?? [{ id: q.filters.id }], error: null }
      if (q.table === 'posts' && q.op === 'delete') return { data: s.deleteRows ?? [{ id: q.filters.id, photo_path: s.deletedPhoto ?? null }], error: null }
      return { data: [], error: null }
    }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      update: (payload) => ((q.op = 'update'), (q.payload = payload), builder),
      delete: () => ((q.op = 'delete'), builder),
      single: () => ((q.mode = 'single'), finish()),
      maybeSingle: () => ((q.mode = 'maybeSingle'), finish()),
      then: (resolve, reject) => finish().then(resolve, reject),
      get captured() {
        return q
      },
    }
    ops.push(builder)
    return builder
  }
  const captured = () => ops.filter((o) => typeof o === 'object').map((b) => b.captured)
  const storageCalls = { uploads: [], removes: [] }
  const client = {
    from,
    auth: { getSession: async () => ({ data: { session: s.session }, error: null }) },
    storage: {
      from: () => ({
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/photos/${path}` } }),
        upload: async (path, blob, options) => {
          ops.push(`storage:upload:${path}`)
          storageCalls.uploads.push({ path, type: options.contentType, size: blob.size, upsert: options.upsert })
          if (s.uploadError) return { data: null, error: s.uploadError }
          return { data: { path }, error: null }
        },
        remove: async (paths) => {
          ops.push(`storage:remove:${paths.join(',')}`)
          storageCalls.removes.push(...paths)
          if (s.removeError) return { data: null, error: s.removeError }
          if (s.removeSilentZero) return { data: [], error: null } // 오류 없이 0건 (읽기 정책이 없을 때 서버가 이렇게 답해요)
          return { data: paths.map((name) => ({ name })), error: null }
        },
      }),
    },
  }
  const sequence = () => ops.filter((o) => typeof o === 'string')
  return { client, storageCalls, sequence, captured }
}
const repoFor = (state) => {
  const fake = makeFake(state)
  return { ...fake, repo: createSupabaseCommunityRepository(async () => fake.client) }
}
const resetStore = () => {
  for (const key of Object.keys(store)) delete store[key]
  storageLog.sets.length = 0
  storageLog.removes.length = 0
}
const insertPayload = (fake) => fake.captured().find((q) => q.table === 'posts' && q.op === 'insert')?.payload
const updatePayload = (fake) => fake.captured().find((q) => q.table === 'posts' && q.op === 'update')?.payload

// ── 글쓰기 ──
{
  const t = repoFor()
  const id = await t.repo.createPost({ ...input, photo: jpeg(2000) })
  check('사진 있는 글: 새 글 ID를 돌려줘요', id === 'new-post')
  check('순서: 사진 올리기 → 글 저장', JSON.stringify(t.sequence().filter((x) => x.startsWith('storage') || x === 'db:posts:insert').map((x) => x.replace(/:me\/.*$/, ''))) === '["storage:upload","db:posts:insert"]', JSON.stringify(t.sequence()))
  const upload = t.storageCalls.uploads[0]
  check('내 폴더(사용자ID/…)에 JPEG로, 덮어쓰지 않고 올려요', /^me\/[^/]+\.jpg$/.test(upload.path) && upload.type === 'image/jpeg' && upload.upsert === false && upload.size > 0)
  check('글에는 올린 사진의 경로가 연결돼요 (카테고리 · 제목 · 내용과 함께)', insertPayload(t).photo_path === upload.path && insertPayload(t).title === '사진 글' && insertPayload(t).category_id === 'photo')
  check('작성자 · 날짜 · EXP는 보내지 않아요', JSON.stringify(Object.keys(insertPayload(t)).sort()) === '["category_id","content","photo_path","title"]')
}
{
  const t = repoFor()
  await t.repo.createPost(input)
  check('사진 없는 글: 사진 올리기 · 경로 없이 저장 (기존과 같아요)', t.storageCalls.uploads.length === 0 && !('photo_path' in insertPayload(t)))
  const t2 = repoFor()
  await t2.repo.createPost({ ...input, photo: null })
  check('photo가 null이어도 사진 없는 글', t2.storageCalls.uploads.length === 0 && !('photo_path' in insertPayload(t2)))
  const t3 = repoFor()
  await t3.repo.createPost({ ...input, photo: webp(2000) })
  check('WebP 사진도 올릴 수 있어요', t3.storageCalls.uploads.length === 1)
}

// ── 사진 점검 (서버에 보내기 전에 거절) ──
{
  const bad = [
    ['PNG 사진', `data:image/png;base64,${Buffer.alloc(100).toString('base64')}`],
    ['1MB를 넘는 사진', jpeg(1048576 + 4000)],
    ['사진이 아닌 문자열', 'https://example.com/x.jpg'],
  ]
  for (const [label, photo] of bad) {
    const t = repoFor()
    const error = await rejects(t.repo.createPost({ ...input, photo }))
    check(`${label}: 올리기 전에 거절하고 서버에는 아무것도 보내지 않아요`, error?.code === 'INVALID_PHOTO' && /JPEG/.test(error.message) && /1MB/.test(error.message) && t.sequence().length === 0, `${error?.code}`)
  }
  const exactly = repoFor()
  check('정확히 1MB는 올릴 수 있어요', (await rejects(exactly.repo.createPost({ ...input, photo: jpeg(1048576) }))) === null)
}

// ── 업로드 실패: 글은 저장하지 않고, 호출한 화면의 입력은 그대로 ──
{
  const t = repoFor({ uploadError: { message: 'Bucket not found' } })
  const original = { ...input, photo: jpeg(1000) }
  const error = await rejects(t.repo.createPost(original))
  check('사진 올리기 실패 -> PHOTO_FAILED, 글은 저장하지 않아요', error?.code === 'PHOTO_FAILED' && !t.sequence().includes('db:posts:insert'))
  check('안내: 작성한 글은 그대로 남아 있고 사진 없이 저장할 수 있다고 알려줘요', error.message.includes('작성한 글은 그대로') && error.message.includes('사진 없이 글만'))
  check('저장소는 입력(제목 · 본문 · 카테고리)을 바꾸지 않아요', original.title === '사진 글' && original.content === '내용' && original.categoryId === 'photo')
  const net = repoFor({ uploadError: Object.assign(new TypeError('Failed to fetch'), {}) })
  check('인터넷이 끊겨 올리지 못하면 연결 안내(NETWORK)', (await rejects(net.repo.createPost({ ...input, photo: jpeg(1000) })))?.code === 'NETWORK')
  // 같은 입력으로 사진만 빼고 다시 저장 (화면의 "사진 없이 글만 저장")
  const retry = repoFor()
  const id = await retry.repo.createPost({ ...original, photo: null })
  check('사진 없이 글만 다시 저장하면 성공 (같은 제목 · 본문 · 카테고리)', id === 'new-post' && insertPayload(retry).title === '사진 글' && !('photo_path' in insertPayload(retry)))
}

// ── 글 저장 실패: 방금 올린 사진 정리 ──
{
  resetStore()
  const t = repoFor({ dbError: { 'posts:insert': { code: '23514', message: 'check' } } })
  const error = await rejects(t.repo.createPost({ ...input, photo: jpeg(1000) }))
  check('글 저장이 실패하면 방금 올린 사진 파일을 지워요', error?.code === 'INVALID_INPUT' && t.storageCalls.removes.length === 1 && t.storageCalls.removes[0] === t.storageCalls.uploads[0].path)
  check('정리가 성공하면 남은 파일 기록은 없어요', listOrphanPhotos('me').length === 0)
  resetStore()
  const t2 = repoFor({ dbError: { 'posts:insert': { code: '23514', message: 'check' } }, removeSilentZero: true })
  await rejects(t2.repo.createPost({ ...input, photo: jpeg(1000) }))
  check('정리가 오류 없이 0건 처리돼도(권한 문제) 실패로 보고 남은 파일을 기록해요', listOrphanPhotos('me').length === 1 && listOrphanPhotos('me')[0].path === t2.storageCalls.uploads[0].path && listOrphanPhotos('me')[0].reason.length > 0)
}

// ── 글 고치기: 사진 유지 / 빼기 / 교체 ──
{
  resetStore()
  const keep = repoFor()
  const r = await keep.repo.updatePost('p1', { ...input })
  check('사진 그대로(photo 없음): 사진 관련 호출이 전혀 없고 photo_path도 보내지 않아요', r.photoCleanup === 'none' && keep.storageCalls.uploads.length === 0 && keep.storageCalls.removes.length === 0 && !('photo_path' in updatePayload(keep)) && !keep.sequence().includes('db:posts:select'))
  const keepUrl = repoFor()
  await keepUrl.repo.updatePost('p1', { ...input, photo: 'https://cdn.test/photos/me/old.jpg' })
  check('이미 올라간 사진 주소를 그대로 보내면 사진은 건드리지 않아요', keepUrl.storageCalls.uploads.length === 0 && keepUrl.storageCalls.removes.length === 0 && !('photo_path' in updatePayload(keepUrl)))

  const remove = repoFor()
  const rr = await remove.repo.updatePost('p1', { ...input, photo: null })
  check('사진 빼기: photo_path를 비우고 옛 파일을 지워요 (글 고치기 성공 뒤에)', updatePayload(remove).photo_path === null && JSON.stringify(remove.sequence().filter((x) => x.startsWith('storage') || x === 'db:posts:update')) === '["db:posts:update","storage:remove:me/old.jpg"]' && rr.photoCleanup === 'ok', JSON.stringify(remove.sequence()))

  const replace = repoFor()
  const rp = await replace.repo.updatePost('p1', { ...input, photo: jpeg(3000) })
  const newPath = replace.storageCalls.uploads[0].path
  check('사진 교체: 새 사진 올리기 -> 글 고치기 -> 옛 사진 지우기 순서', JSON.stringify(replace.sequence().filter((x) => x.startsWith('storage') || x === 'db:posts:update').map((x) => x.replace(newPath, 'NEW'))) === '["storage:upload:NEW","db:posts:update","storage:remove:me/old.jpg"]', JSON.stringify(replace.sequence()))
  check('교체: 글에는 새 경로, 지운 것은 옛 파일뿐 (새 파일은 지우지 않아요)', updatePayload(replace).photo_path === newPath && replace.storageCalls.removes.join(',') === 'me/old.jpg' && rp.photoCleanup === 'ok')
  check('내 글 조건(id + user_id)으로만 고쳐요', replace.captured().find((q) => q.op === 'update').filters.user_id === 'me')

  const addNew = repoFor({ currentPhoto: null })
  const ra = await addNew.repo.updatePost('p1', { ...input, photo: jpeg(1000) })
  check('사진이 없던 글에 사진 추가: 지울 옛 파일이 없어요', addNew.storageCalls.uploads.length === 1 && addNew.storageCalls.removes.length === 0 && ra.photoCleanup === 'none')
}

// ── 글 고치기 실패: 옛 사진은 그대로, 새 사진만 정리 ──
{
  resetStore()
  const noRows = repoFor({ updateRows: [] })
  const error = await rejects(noRows.repo.updatePost('p1', { ...input, photo: jpeg(1000) }))
  check('글 고치기가 실패하면(남의 글 · 없는 글) 새로 올린 사진만 지우고 옛 사진은 그대로예요', error?.code === 'POST_NOT_FOUND' && noRows.storageCalls.removes.length === 1 && noRows.storageCalls.removes[0] === noRows.storageCalls.uploads[0].path && !noRows.storageCalls.removes.includes('me/old.jpg'))
  const uploadFail = repoFor({ uploadError: { message: 'Bucket not found' } })
  const e2 = await rejects(uploadFail.repo.updatePost('p1', { ...input, photo: jpeg(1000) }))
  check('교체 중 사진 올리기가 실패하면 PHOTO_FAILED, 글도 옛 사진도 건드리지 않아요', e2?.code === 'PHOTO_FAILED' && !uploadFail.sequence().includes('db:posts:update') && uploadFail.storageCalls.removes.length === 0)
  const notMine = repoFor({ currentPost: null })
  const e3 = await rejects(notMine.repo.updatePost('p1', { ...input, photo: null }))
  check('내 글이 아니면 사진을 빼려는 시도도 거절 (옛 파일을 지우지 않아요)', e3?.code === 'POST_NOT_FOUND' && notMine.storageCalls.removes.length === 0 && notMine.storageCalls.uploads.length === 0)
}

// ── 글 지우기와 사진 정리 ──
{
  resetStore()
  const t = repoFor({ deletedPhoto: 'me/photo.jpg' })
  const r = await t.repo.deletePost('p1')
  check('글 삭제: 글을 지운 뒤 사진 파일도 지워요', r.photoCleanup === 'ok' && r.orphanPath === null && t.storageCalls.removes.join(',') === 'me/photo.jpg' && JSON.stringify(t.sequence().filter((x) => x.startsWith('storage') || x === 'db:posts:delete')) === '["db:posts:delete","storage:remove:me/photo.jpg"]')
  check('내 글 조건(id + user_id)으로만 지워요', t.captured().find((q) => q.op === 'delete').filters.user_id === 'me')
  const noPhoto = repoFor()
  const r2 = await noPhoto.repo.deletePost('p1')
  check('사진 없는 글 삭제: 사진 정리 호출 없음', r2.photoCleanup === 'none' && noPhoto.storageCalls.removes.length === 0)
  const already = repoFor({ deleteRows: [] })
  const r3 = await already.repo.deletePost('p1')
  check('이미 없는 글 삭제는 성공 (사진 정리 호출 없음)', r3.photoCleanup === 'none' && already.storageCalls.removes.length === 0)
}
{
  resetStore()
  const silent = repoFor({ deletedPhoto: 'me/photo.jpg', removeSilentZero: true })
  const r = await silent.repo.deletePost('p1')
  check('파일 정리가 실패해도(0건 처리) 글 삭제는 성공으로 두고, 남은 파일을 알려줘요', r.photoCleanup === 'failed' && r.orphanPath === 'me/photo.jpg')
  check('남은 파일이 이 브라우저에 기록돼요 (계정별 키)', listOrphanPhotos('me').length === 1 && listOrphanPhotos('me')[0].path === 'me/photo.jpg' && Object.keys(store).join(',') === 'my-bakery-review:v1:orphan-photos:me')
  check('다른 계정에는 보이지 않아요', listOrphanPhotos('someone-else').length === 0)
  check('저장소 메서드로도 남은 파일을 볼 수 있어요', (await silent.repo.listLeftoverPhotos()).map((p) => p.path).join(',') === 'me/photo.jpg')

  const err = repoFor({ deletedPhoto: 'me/photo2.jpg', removeError: { message: 'storage down' } })
  const r2 = await err.repo.deletePost('p1')
  check('파일 정리 중 오류가 나도 글 삭제는 성공 + 남은 파일 기록(이유 포함)', r2.photoCleanup === 'failed' && listOrphanPhotos('me').find((p) => p.path === 'me/photo2.jpg')?.reason.includes('storage down'))

  // 다시 정리 시도: 이번에는 서버가 지워 줌 -> 기록에서 사라져요
  const retryOk = repoFor()
  const left = await retryOk.repo.retryPhotoCleanup()
  check('다시 정리하면 지워진 파일은 기록에서 빠져요', left.length === 0 && retryOk.storageCalls.removes.sort().join(',') === 'me/photo.jpg,me/photo2.jpg' && listOrphanPhotos('me').length === 0 && !('my-bakery-review:v1:orphan-photos:me' in store))
  recordOrphanPhoto('me', 'me/stuck.jpg', '테스트')
  const retryFail = repoFor({ removeSilentZero: true })
  const stuck = await retryFail.repo.retryPhotoCleanup()
  check('다시 정리해도 안 지워지면 계속 기록에 남아요', stuck.length === 1 && stuck[0].path === 'me/stuck.jpg')
  check('비로그인은 정리 대상 없음', (await repoFor({ session: null }).repo.retryPhotoCleanup()).length === 0)
}

// ── 사진 주소 ──
{
  const rows = [
    { id: 'a', category_id: 'photo', title: 'a', content: 'x', user_id: 'u', author_nickname: 'n', created_at: 't', updated_at: 't', photo_path: 'u/p.jpg' },
    { id: 'b', category_id: 'photo', title: 'b', content: 'x', user_id: 'u', author_nickname: 'n', created_at: 't', updated_at: 't', photo_path: null },
  ]
  const client = {
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
    storage: { from: () => ({ getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.test/photos/${p}` } }) }) },
    from: () => {
      const b = { select: () => b, eq: () => b, order: () => b, range: async () => ({ data: rows, error: null, count: 2 }), maybeSingle: async () => ({ data: rows[0], error: null }) }
      return b
    },
  }
  const repo = createSupabaseCommunityRepository(async () => client)
  const { posts } = await repo.listPosts()
  check('목록: 사진 있는 글은 공개 주소(photoUrl), 없는 글은 null (화면은 이모지를 그대로 써요)', posts[0].photoUrl === 'https://cdn.test/photos/u/p.jpg' && posts[0].photoPath === 'u/p.jpg' && posts[1].photoUrl === null && posts[1].photoPath === null)
  check('글 상세도 같은 사진 주소', (await repo.getPost('a')).photoUrl === 'https://cdn.test/photos/u/p.jpg')
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
