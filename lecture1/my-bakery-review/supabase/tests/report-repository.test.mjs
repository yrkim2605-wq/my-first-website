// 신고 저장소(supabaseReportRepository) 검증. 진짜 Supabase 서버에는 연결하지 않고 가짜 클라이언트로 시험해요.
// 실행: node supabase/tests/report-repository.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { createSupabaseReportRepository, validateReport, toReportError, REPORT_REASONS, UNRELATED_PHOTO_TAG, getReportDetailMax } = await server.ssrLoadModule('/src/storage/supabaseReportRepository.js')

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

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

// 가짜 클라이언트: 호출 기록 + 시나리오(state)
const makeClient = (state = {}) => {
  const calls = []
  const record = (name, args) => calls.push([name, args])
  const reportsQuery = (rows) => {
    const builder = {
      select: (columns) => (record('select', ['reports', columns]), builder),
      eq: (column, value) => (record('eq', [column, value]), builder),
      order: (column, options) => (record('order', [column, options]), builder),
      limit: async (count) => (record('limit', [count]), state.listError ? { data: null, error: state.listError } : { data: rows, error: null }),
    }
    return builder
  }
  const client = {
    calls,
    from: (table) => {
      if (table === 'reports') {
        return {
          insert: async (row) => {
            record('insert', [table, row])
            if (state.networkDown) throw new TypeError('Failed to fetch')
            return { error: state.insertError ?? null }
          },
          ...reportsQuery(state.rows ?? []),
        }
      }
      if (table === 'profiles') {
        return { select: () => ({ in: async (column, ids) => (record('profiles.in', [column, ids]), { data: state.profiles ?? [], error: null }) }) }
      }
      if (table === 'reviews') {
        // 신고된 리뷰의 사진 경로 찾기 (운영자 화면 미리보기용)
        return {
          select: () => ({
            in: async (column, ids) => (record('reviews.in', [column, ids]), state.reviewsError ? { data: null, error: state.reviewsError } : { data: state.reviewRows ?? [], error: null }),
          }),
        }
      }
      throw new Error('unexpected table ' + table)
    },
    rpc: async (name, args) => {
      record('rpc', [name, args])
      if (name === 'is_admin') return state.rpcAdminError ? { data: null, error: state.rpcAdminError } : { data: state.isAdmin ?? false, error: null }
      return state.rpcError ? { data: null, error: state.rpcError } : { data: state.rpcData ?? { photo_path: null }, error: null }
    },
    storage: {
      from: (bucket) => ({
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }),
        remove: async (paths) => {
          record('storage.remove', [bucket, paths])
          if (state.removeError) return { data: null, error: state.removeError }
          return { data: state.removeData ?? paths.map((name) => ({ name })), error: null }
        },
      }),
    },
  }
  return client
}
const repoFor = (state) => {
  const client = makeClient(state)
  return { client, repo: createSupabaseReportRepository(async () => client) }
}
const serverError = (message, code) => Object.assign(new Error(message), code ? { code } : {})

// ── 입력 검증 ──
check('올바른 신고 입력은 통과 (상세는 비면 null)', validateReport({ targetType: 'post', targetId: UUID, reason: 'spam', detail: '  ' }).detail === null)
check('상세 앞뒤 공백 정리', validateReport({ targetType: 'comment', targetId: UUID, reason: 'other', detail: ' 이상해요 ' }).detail === '이상해요')
for (const [label, input] of [
  ['모르는 대상 종류', { targetType: 'user', targetId: UUID, reason: 'spam' }],
  ['UUID가 아닌 대상 id', { targetType: 'post', targetId: '1; drop table', reason: 'spam' }],
  ['정해진 사유가 아님', { targetType: 'post', targetId: UUID, reason: 'because' }],
  ['상세 301자', { targetType: 'post', targetId: UUID, reason: 'other', detail: 'x'.repeat(301) }],
  ['사유 없음', { targetType: 'post', targetId: UUID }],
]) {
  check(`거부: ${label}`, (() => { try { validateReport(input); return false } catch (error) { return error.code === 'INVALID_INPUT' } })())
}

// ── 신고하기 ──
{
  const { repo, client } = repoFor({})
  await repo.createReport({ targetType: 'review', targetId: UUID, reason: 'abuse', detail: '욕설' })
  const [, [table, row]] = client.calls.find(([name]) => name === 'insert') && [0, client.calls.find(([name]) => name === 'insert')[1]]
  check('신고는 4칸만 보내요 (신고자 · 상태 · 작성자 · 내용은 보내지 않아요)', table === 'reports' && JSON.stringify(Object.keys(row).sort()) === JSON.stringify(['detail', 'reason', 'target_id', 'target_type']), JSON.stringify(row))
}
{
  const { repo, client } = repoFor({})
  await rejects(repo.createReport({ targetType: 'post', targetId: 'x', reason: 'spam' }))
  check('잘못된 입력은 서버에 보내지 않아요', !client.calls.some(([name]) => name === 'insert'))
}
for (const [label, error, expected] of [
  ['내 글 신고', serverError('OWN_CONTENT'), 'OWN_CONTENT'],
  ['없는 대상', serverError('TARGET_NOT_FOUND'), 'TARGET_NOT_FOUND'],
  ['하루 한도', serverError('DAILY_REPORT_LIMIT'), 'DAILY_REPORT_LIMIT'],
  ['중복 신고', serverError('duplicate key value', '23505'), 'DUPLICATE_REPORT'],
  ['이메일 미인증', serverError('EMAIL_NOT_VERIFIED'), 'EMAIL_NOT_CONFIRMED'],
  ['로그인 풀림', serverError('NOT_SIGNED_IN'), 'SESSION_EXPIRED'],
]) {
  const caught = await rejects(repoFor({ insertError: error }).repo.createReport({ targetType: 'post', targetId: UUID, reason: 'spam' }))
  check(`서버 오류 → 안내: ${label}`, caught?.code === expected && typeof caught.message === 'string' && caught.message.length > 0, `${caught?.code}`)
}
check('신고 중 네트워크 오류 안내', (await rejects(repoFor({ networkDown: true }).repo.createReport({ targetType: 'post', targetId: UUID, reason: 'spam' })))?.code === 'NETWORK')

// ── 운영자 확인 ──
check('운영자면 true', (await repoFor({ isAdmin: true }).repo.isAdmin()) === true)
check('일반 사용자는 false', (await repoFor({ isAdmin: false }).repo.isAdmin()) === false)
check('서버 오류면 false (운영자 화면을 열지 않아요)', (await repoFor({ rpcAdminError: serverError('boom') }).repo.isAdmin()) === false)
check('is_admin이 true가 아닌 값(null 등)이면 false', (await repoFor({ isAdmin: 'yes' }).repo.isAdmin()) === false)

// ── 신고 목록 ──
{
  const rows = [{ id: UUID, target_type: 'post', target_id: UUID2, reason: 'spam', detail: null, target_user_id: 'u9', target_snapshot: '광고 글', target_context: null, status: 'open', handled_note: null, handled_at: null, created_at: '2026-10-14T00:00:00Z' }]
  const { repo, client } = repoFor({ rows, profiles: [{ id: 'u9', nickname: '작성자9' }] })
  const list = await repo.listReports({ status: 'open' })
  check('목록: 작성자 닉네임을 붙여서 돌려줘요', list.length === 1 && list[0].targetAuthor === '작성자9' && list[0].snapshot === '광고 글' && list[0].detail === '')
  check('열린 신고는 오래된 순, 최대 100건', client.calls.some(([name, args]) => name === 'order' && args[1].ascending === true) && client.calls.some(([name, args]) => name === 'limit' && args[0] === 100))
  const none = await repoFor({ rows: [], profiles: [] }).repo.listReports({ status: 'resolved' })
  check('빈 목록', Array.isArray(none) && none.length === 0)
  check('처리된 신고는 최신순', repoFor({ rows: [] }) && (await (async () => { const r = repoFor({ rows: [] }); await r.repo.listReports({ status: 'rejected' }); return r.client.calls.some(([name, args]) => name === 'order' && args[1].ascending === false) })()))
}
check('모르는 상태는 거부', (await rejects(repoFor({}).repo.listReports({ status: 'all' })))?.code === 'INVALID_INPUT')
check('목록 오류 안내', (await rejects(repoFor({ listError: serverError('x') }).repo.listReports()))?.message?.length > 0)

// ── 신고 처리 ──
{
  const { repo, client } = repoFor({ rpcData: { photo_path: 'u1/p.jpg' } })
  const result = await repo.handleReport({ reportId: UUID, action: 'remove', note: ' 욕설 확인 ' })
  const rpc = client.calls.find(([name]) => name === 'rpc')[1]
  check('삭제 처리: 서버 함수에 신고 · 처리 방법 · 메모만 보내요', rpc[0] === 'admin_handle_report' && JSON.stringify(rpc[1]) === JSON.stringify({ p_report_id: UUID, p_action: 'remove', p_note: '욕설 확인' }))
  check('삭제한 글의 사진 파일도 지워요', result.photoPath === 'u1/p.jpg' && result.photoRemoved === true && client.calls.some(([name, args]) => name === 'storage.remove' && args[0] === 'photos' && args[1][0] === 'u1/p.jpg'))
}
{
  const { repo, client } = repoFor({ rpcData: { photo_path: null } })
  const result = await repo.handleReport({ reportId: UUID, action: 'dismiss' })
  check('사진이 없으면 파일 삭제를 부르지 않아요', result.photoRemoved === null && !client.calls.some(([name]) => name === 'storage.remove'))
  check('메모가 없으면 null로 보내요', client.calls.find(([name]) => name === 'rpc')[1][1].p_note === null)
}
{
  const result = await repoFor({ rpcData: { photo_path: 'u1/p.jpg' }, removeError: serverError('denied') }).repo.handleReport({ reportId: UUID, action: 'remove' })
  check('파일 삭제에 실패해도 처리는 끝난 것으로 알려주고 경로를 돌려줘요', result.photoPath === 'u1/p.jpg' && result.photoRemoved === false)
}
{
  const result = await repoFor({ rpcData: { photo_path: 'u1/p.jpg' }, removeData: [] }).repo.handleReport({ reportId: UUID, action: 'remove' })
  check('서버가 파일을 지웠다고 확인해 주지 않으면 실패로 봐요', result.photoRemoved === false)
}
for (const [label, error, expected] of [
  ['운영자가 아님', serverError('NOT_ADMIN'), 'NOT_ADMIN'],
  ['이미 처리됨', serverError('ALREADY_HANDLED'), 'ALREADY_HANDLED'],
  ['없는 신고', serverError('REPORT_NOT_FOUND'), 'REPORT_NOT_FOUND'],
]) {
  const { repo, client } = repoFor({ rpcError: error })
  const caught = await rejects(repo.handleReport({ reportId: UUID, action: 'dismiss' }))
  check(`처리 오류 → 안내: ${label} (파일은 건드리지 않아요)`, caught?.code === expected && !client.calls.some(([name]) => name === 'storage.remove'))
}
for (const [label, input] of [
  ['UUID가 아닌 신고 id', { reportId: 'x', action: 'dismiss' }],
  ['모르는 처리 방법', { reportId: UUID, action: 'ban' }],
  ['메모 301자', { reportId: UUID, action: 'dismiss', note: 'x'.repeat(301) }],
]) {
  const { repo, client } = repoFor({})
  const caught = await rejects(repo.handleReport(input))
  check(`처리 입력 거부: ${label} (서버에 보내지 않아요)`, caught?.code === 'INVALID_INPUT' && !client.calls.some(([name]) => name === 'rpc'))
}
check('toReportError는 이미 변환된 오류를 그대로 둬요', (() => { const e = toReportError(serverError('OWN_CONTENT')); return toReportError(e) === e })())

// ── "빵집과 관련 없는 사진" 사유: 서버 제약(5가지 코드)을 지키는 매핑 ──
const throwsInvalid = (input) => { try { validateReport(input); return false } catch (error) { return error.code === 'INVALID_INPUT' } }
check('사유 목록에 "빵집과 관련 없는 사진"이 있고 일지에만 쓰여요', REPORT_REASONS.some((item) => item.id === 'unrelated_photo' && item.label === '빵집과 관련 없는 사진' && item.targetTypes?.join() === 'review'))
check('나머지 사유는 모든 대상에 쓸 수 있어요 (기존 5가지 그대로)', ['spam', 'abuse', 'illegal', 'privacy', 'other'].every((id) => REPORT_REASONS.some((item) => item.id === id && !item.targetTypes)))
{
  const noDetail = validateReport({ targetType: 'review', targetId: UUID, reason: 'unrelated_photo' })
  check('서버에는 기존 코드 other로 보내요 (새 코드는 서버 제약이 거절해요)', noDetail.reason === 'other' && !JSON.stringify(noDetail).includes('unrelated_photo'))
  check('자세한 내용이 없으면 구분 표식만 보내요', noDetail.detail === UNRELATED_PHOTO_TAG)
  check('자세한 내용이 있으면 표식 + 내용', validateReport({ targetType: 'review', targetId: UUID, reason: 'unrelated_photo', detail: ' 고양이 사진이에요 ' }).detail === `${UNRELATED_PHOTO_TAG} 고양이 사진이에요`)
}
check('거부: 글 · 댓글에는 이 사유를 쓸 수 없어요', throwsInvalid({ targetType: 'post', targetId: UUID, reason: 'unrelated_photo' }) && throwsInvalid({ targetType: 'comment', targetId: UUID, reason: 'unrelated_photo' }))
{
  const max = getReportDetailMax('unrelated_photo')
  check('이 사유의 내용 한도는 표식 자리를 뺀 만큼이에요 (보내는 전체는 300자 이내)', getReportDetailMax('spam') === 300 && max === 300 - UNRELATED_PHOTO_TAG.length - 1 && validateReport({ targetType: 'review', targetId: UUID, reason: 'unrelated_photo', detail: 'x'.repeat(max) }).detail.length === 300)
  check('거부: 이 사유의 한도를 넘으면', throwsInvalid({ targetType: 'review', targetId: UUID, reason: 'unrelated_photo', detail: 'x'.repeat(max + 1) }))
}
{
  const { repo, client } = repoFor({})
  await repo.createReport({ targetType: 'review', targetId: UUID, reason: 'unrelated_photo', detail: '무관해요' })
  const row = client.calls.find(([name]) => name === 'insert')[1][1]
  check('신고하기가 보내는 값: other + 표식, 4칸만', row.reason === 'other' && row.detail === `${UNRELATED_PHOTO_TAG} 무관해요` && Object.keys(row).length === 4)
}

// ── 운영자 목록: 사유 구분 · 사진 미리보기 ──
{
  const rid = ['a', 'b', 'c'].map((ch) => ch.repeat(8) + '-1111-4111-8111-' + ch.repeat(12)) // 리뷰 id 3개
  const base = { target_user_id: 'u9', target_snapshot: '일지 내용', target_context: '123', status: 'open', handled_note: null, handled_at: null, created_at: '2026-10-14T00:00:00Z' }
  const rows = [
    { ...base, id: UUID, target_type: 'review', target_id: rid[0], reason: 'other', detail: `${UNRELATED_PHOTO_TAG} 고양이 사진` },
    { ...base, id: UUID2, target_type: 'review', target_id: rid[1], reason: 'other', detail: '그냥 기타 사유' },
    { ...base, id: '33333333-3333-4333-8333-333333333333', target_type: 'review', target_id: rid[2], reason: 'spam', detail: `${UNRELATED_PHOTO_TAG} 표식을 흉내냄` },
    { ...base, id: '44444444-4444-4444-8444-444444444444', target_type: 'post', target_id: UUID2, reason: 'spam', detail: null },
  ]
  const { repo, client } = repoFor({ rows, profiles: [{ id: 'u9', nickname: '작성자9' }], reviewRows: [{ id: rid[0], photo_path: 'u1/p.jpg' }, { id: rid[1], photo_path: null }] })
  const list = await repo.listReports({ status: 'open' })
  check('표식이 붙은 기타 사유는 "관련 없는 사진"으로 구분되고 표식은 내용에서 빠져요', list[0].reason === 'unrelated_photo' && list[0].detail === '고양이 사진')
  check('일반 기타 사유는 그대로', list[1].reason === 'other' && list[1].detail === '그냥 기타 사유')
  check('기타가 아닌 사유는 표식을 흉내내도 바뀌지 않아요', list[2].reason === 'spam' && list[2].detail.startsWith(UNRELATED_PHOTO_TAG))
  check('사진 있는 리뷰: 공개 주소로 미리보기', list[0].photo.status === 'ready' && list[0].photo.url === 'https://cdn.test/photos/u1/p.jpg')
  check('사진 없는 리뷰: none', list[1].photo.status === 'none' && list[1].photo.url === null)
  check('이미 삭제된 리뷰(조회 결과에 없음): gone', list[2].photo.status === 'gone')
  check('글 · 댓글 신고에는 사진 정보가 없어요 (null)', list[3].photo === null)
  const lookups = client.calls.filter(([name]) => name === 'reviews.in')
  check('리뷰 사진은 한 번에 모아서 조회해요 (리뷰 신고 3건만)', lookups.length === 1 && lookups[0][1][1].length === 3)
}
{
  const { repo, client } = repoFor({ rows: [{ id: UUID, target_type: 'post', target_id: UUID2, reason: 'spam', detail: null, target_user_id: 'u9', target_snapshot: '글', target_context: null, status: 'open', handled_note: null, handled_at: null, created_at: '2026-10-14T00:00:00Z' }], profiles: [] })
  await repo.listReports({ status: 'open' })
  check('리뷰 신고가 없으면 리뷰를 조회하지 않아요', !client.calls.some(([name]) => name === 'reviews.in'))
}
{
  const rid = 'dddddddd-1111-4111-8111-dddddddddddd'
  const rows = [{ id: UUID, target_type: 'review', target_id: rid, reason: 'illegal', detail: null, target_user_id: 'u9', target_snapshot: '일지', target_context: '1', status: 'open', handled_note: null, handled_at: null, created_at: '2026-10-14T00:00:00Z' }]
  const list = await repoFor({ rows, profiles: [], reviewsError: serverError('boom') }).repo.listReports({ status: 'open' })
  check('사진 조회가 실패해도 신고 목록은 그대로 보여요 (그 신고만 error)', list.length === 1 && list[0].photo.status === 'error' && list[0].reason === 'illegal')
}

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
