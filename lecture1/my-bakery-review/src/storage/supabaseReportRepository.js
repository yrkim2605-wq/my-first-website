import { RepositoryError } from './localStore'
import { toReviewError } from './supabaseShared'
import { PHOTO_BUCKET } from './photoStorage'

// 신고 저장소 — Supabase 버전이에요 (reports 표, 마이그레이션 0009 · 0010).
//  - 신고는 이메일 인증을 마친 로그인 사용자만 할 수 있고, 신고자 · 상태 · 작성자 · 내용은 서버가 정해요. 이 파일은 "무엇을, 왜"만 보내요.
//  - 운영자 확인(isAdmin)과 처리(handleReport)도 서버가 한 번 더 검사해요. 이 파일의 isAdmin은 "화면을 보여줄지" 정하는 데만 써요.
//  - 연결에 실패하면 로컬에 대신 저장하지 않고 오류를 던져요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)

export const REPORT_TARGET_TYPES = ['post', 'comment', 'review']
// targetTypes: 이 사유를 보여줄 대상 (없으면 모두). 'unrelated_photo'는 일지(리뷰) 사진에만 써요.
export const UNRELATED_PHOTO_REASON = 'unrelated_photo'
export const REPORT_REASONS = [
  { id: 'spam', label: '광고 · 도배' },
  { id: 'abuse', label: '욕설 · 혐오 · 비방' },
  { id: 'illegal', label: '불법 · 음란 · 폭력적인 내용' },
  { id: 'privacy', label: '개인정보 · 사생활 침해' },
  { id: UNRELATED_PHOTO_REASON, label: '빵집과 관련 없는 사진', targetTypes: ['review'] },
  { id: 'other', label: '기타' },
]
export const REPORT_DETAIL_MAX = 300

// ── "빵집과 관련 없는 사진" 사유와 서버 규칙 ──
// 서버(reports 표, 0009)는 사유를 spam · abuse · illegal · privacy · other 다섯 가지만 받아요 (check 제약).
// 새 사유 코드를 그대로 보내면 서버가 거절하므로, 서버에는 기존 코드 'other'로 보내고 "자세한 내용" 맨 앞에 구분용 표식을 붙여요.
// 운영자 화면으로 읽어 올 때는 표식을 보고 다시 'unrelated_photo'로 되돌려서 사유가 구분돼요.
// (표식은 사람이 직접 써도 같은 결과예요 — 운영자 화면의 표시만 달라질 뿐 권한이나 처리에는 영향이 없어요.)
// 나중에 서버 제약에 새 코드를 추가하면(공개 베타 전 사진 승인 작업과 함께) 이 매핑을 지우고 코드를 그대로 보내면 돼요.
export const UNRELATED_PHOTO_TAG = '[빵집과 무관한 사진]'

// 사유별로 사용자가 쓸 수 있는 "자세한 내용" 최대 글자 수 (표식이 들어갈 자리를 빼요)
export const getReportDetailMax = (reason) => (reason === UNRELATED_PHOTO_REASON ? REPORT_DETAIL_MAX - UNRELATED_PHOTO_TAG.length - 1 : REPORT_DETAIL_MAX)

// 서버에서 읽은 (reason, detail)을 화면용 사유로 되돌려요
const decodeReason = (reason, detail) => {
  const text = detail ?? ''
  if (reason === 'other' && text.startsWith(UNRELATED_PHOTO_TAG)) {
    return { reason: UNRELATED_PHOTO_REASON, detail: text.slice(UNRELATED_PHOTO_TAG.length).trim() }
  }
  return { reason, detail: text }
}
export const REPORT_NOTE_MAX = 300
export const REPORT_STATUSES = ['open', 'resolved', 'rejected']
export const REPORT_ACTIONS = ['dismiss', 'remove']

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const reportMessages = {
  OWN_CONTENT: '내가 쓴 글은 신고할 수 없어요.',
  TARGET_NOT_FOUND: '신고하려는 글을 찾을 수 없어요. 이미 지워졌을 수 있어요.',
  DUPLICATE_REPORT: '이미 신고한 글이에요. 운영자가 확인할 거예요.',
  DAILY_REPORT_LIMIT: '오늘은 신고를 너무 많이 했어요 (하루 20건까지). 내일 다시 해 주세요.',
  NOT_ADMIN: '운영자만 쓸 수 있는 기능이에요.',
  ALREADY_HANDLED: '이미 처리된 신고예요. 목록을 새로고침해 주세요.',
  REPORT_NOT_FOUND: '신고를 찾을 수 없어요.',
  INVALID_INPUT: '신고 사유와 내용을 다시 확인해 주세요.',
}

// Supabase / 저장소 오류 → 사용자에게 보여줄 한국어 안내 (신고 전용 문구를 먼저 보고, 나머지는 공통 처리)
export const toReportError = (error) => {
  if (error instanceof RepositoryError) return error
  const text = String(error?.message ?? '')
  for (const code of ['OWN_CONTENT', 'TARGET_NOT_FOUND', 'DAILY_REPORT_LIMIT', 'NOT_ADMIN', 'ALREADY_HANDLED', 'REPORT_NOT_FOUND']) {
    if (text.includes(code)) return new RepositoryError(code, reportMessages[code])
  }
  if (/INVALID_ACTION|NOTE_TOO_LONG/.test(text) || error?.code === '23514') return new RepositoryError('INVALID_INPUT', reportMessages.INVALID_INPUT)
  if (error?.code === '23505') return new RepositoryError('DUPLICATE_REPORT', reportMessages.DUPLICATE_REPORT)
  return toReviewError(error, 'report')
}

export const validateReport = ({ targetType, targetId, reason, detail }) => {
  if (!REPORT_TARGET_TYPES.includes(targetType)) throw new RepositoryError('INVALID_INPUT', '신고할 대상을 확인할 수 없어요.')
  if (!UUID_PATTERN.test(String(targetId ?? ''))) throw new RepositoryError('INVALID_INPUT', '신고할 대상을 확인할 수 없어요.')
  const reasonItem = REPORT_REASONS.find((item) => item.id === reason)
  if (!reasonItem) throw new RepositoryError('INVALID_INPUT', '신고 사유를 골라 주세요.')
  if (reasonItem.targetTypes && !reasonItem.targetTypes.includes(targetType)) throw new RepositoryError('INVALID_INPUT', '이 사유는 일지(리뷰) 사진을 신고할 때만 쓸 수 있어요.')
  const cleanDetail = String(detail ?? '').trim()
  const detailMax = getReportDetailMax(reason)
  if (cleanDetail.length > detailMax) throw new RepositoryError('INVALID_INPUT', `자세한 내용은 ${detailMax}자까지 쓸 수 있어요.`)
  if (reason === UNRELATED_PHOTO_REASON) {
    // 서버가 아는 사유 'other'로 보내고, 표식으로 구분해요 (위 설명 참고)
    return { target_type: targetType, target_id: String(targetId), reason: 'other', detail: cleanDetail ? `${UNRELATED_PHOTO_TAG} ${cleanDetail}` : UNRELATED_PHOTO_TAG }
  }
  return { target_type: targetType, target_id: String(targetId), reason, detail: cleanDetail || null }
}

const REPORT_COLUMNS = 'id, target_type, target_id, reason, detail, target_user_id, target_snapshot, target_context, status, handled_note, handled_at, created_at'

// 신고된 리뷰의 사진을 운영자 화면에서 바로 볼 수 있게 찾아요 (리뷰는 모두 공개로 읽히고 사진 저장소도 공개 읽기예요).
// status: 'ready' 사진 있음(url) · 'none' 사진 없는 리뷰 · 'gone' 리뷰가 이미 삭제됨 · 'error' 사진 정보를 못 불러옴
// 사진 찾기가 실패해도 신고 목록 전체는 그대로 보여요 (그 신고만 'error').
const lookupReviewPhotos = async (client, reviewIds) => {
  const result = new Map()
  if (reviewIds.length === 0) return result
  try {
    const { data, error } = await client.from('reviews').select('id, photo_path').in('id', reviewIds)
    if (error) throw error
    const pathById = new Map((data ?? []).map((review) => [review.id, review.photo_path]))
    for (const id of reviewIds) {
      if (!pathById.has(id)) result.set(id, { status: 'gone', url: null })
      else if (!pathById.get(id)) result.set(id, { status: 'none', url: null })
      else result.set(id, { status: 'ready', url: client.storage.from(PHOTO_BUCKET).getPublicUrl(pathById.get(id)).data.publicUrl })
    }
  } catch {
    for (const id of reviewIds) result.set(id, { status: 'error', url: null })
  }
  return result
}

const toReport = (row, nicknames, photos) => ({
  id: row.id,
  targetType: row.target_type,
  targetId: row.target_id,
  ...decodeReason(row.reason, row.detail),
  // 리뷰 신고만 사진 정보가 있어요 (글 · 댓글은 null)
  photo: row.target_type === 'review' ? (photos.get(row.target_id) ?? { status: 'error', url: null }) : null,
  targetAuthor: nicknames.get(row.target_user_id) ?? '(탈퇴했거나 알 수 없음)',
  snapshot: row.target_snapshot ?? '',
  context: row.target_context ?? null,
  status: row.status,
  handledNote: row.handled_note ?? '',
  handledAt: row.handled_at,
  createdAt: row.created_at,
})

export const createSupabaseReportRepository = (getClient) => ({
  // 신고하기. 성공하면 아무것도 돌려주지 않아요 (신고 내용은 운영자만 읽어요).
  async createReport(input) {
    const row = validateReport(input)
    try {
      const client = await getClient()
      const { error } = await client.from('reports').insert(row)
      if (error) throw error
    } catch (error) {
      throw toReportError(error)
    }
  },

  // 지금 로그인한 사람이 운영자인지 (화면을 보여줄지 정하는 용도예요. 진짜 권한은 서버가 지켜요)
  async isAdmin() {
    try {
      const client = await getClient()
      const { data, error } = await client.rpc('is_admin')
      if (error) return false
      return data === true
    } catch {
      return false
    }
  },

  // 신고 목록 (운영자만 읽혀요. 일반 사용자가 부르면 서버가 자기 신고만 돌려줘요). 오래된 순으로 최대 100건.
  async listReports({ status = 'open' } = {}) {
    if (!REPORT_STATUSES.includes(status)) throw new RepositoryError('INVALID_INPUT', '신고 상태를 확인할 수 없어요.')
    try {
      const client = await getClient()
      const { data, error } = await client
        .from('reports')
        .select(REPORT_COLUMNS)
        .eq('status', status)
        .order('created_at', { ascending: status === 'open' })
        .limit(100)
      if (error) throw error
      const rows = data ?? []
      const authorIds = [...new Set(rows.map((row) => row.target_user_id).filter(Boolean))]
      const nicknames = new Map()
      if (authorIds.length > 0) {
        const { data: profiles, error: profileError } = await client.from('profiles').select('id, nickname').in('id', authorIds)
        if (profileError) throw profileError
        for (const profile of profiles ?? []) nicknames.set(profile.id, profile.nickname)
      }
      const reviewIds = [...new Set(rows.filter((row) => row.target_type === 'review').map((row) => row.target_id))]
      const photos = await lookupReviewPhotos(client, reviewIds)
      return rows.map((row) => toReport(row, nicknames, photos))
    } catch (error) {
      throw toReportError(error)
    }
  },

  // 신고 처리 (운영자만). action: 'dismiss' = 반려 / 'remove' = 신고된 글 삭제 + 처리
  // 삭제한 글에 사진이 있었다면 파일도 지워 봐요. 파일 정리에 실패해도 처리는 끝난 상태이고, 결과로 알려줘요.
  async handleReport({ reportId, action, note }) {
    if (!UUID_PATTERN.test(String(reportId ?? ''))) throw new RepositoryError('INVALID_INPUT', '신고를 확인할 수 없어요.')
    if (!REPORT_ACTIONS.includes(action)) throw new RepositoryError('INVALID_INPUT', '처리 방법을 확인할 수 없어요.')
    const cleanNote = String(note ?? '').trim()
    if (cleanNote.length > REPORT_NOTE_MAX) throw new RepositoryError('INVALID_INPUT', `처리 메모는 ${REPORT_NOTE_MAX}자까지 쓸 수 있어요.`)
    let photoPath
    let client
    try {
      client = await getClient()
      const { data, error } = await client.rpc('admin_handle_report', { p_report_id: reportId, p_action: action, p_note: cleanNote || null })
      if (error) throw error
      photoPath = data?.photo_path ?? null
    } catch (error) {
      throw toReportError(error)
    }
    if (!photoPath) return { photoPath: null, photoRemoved: null }
    try {
      const { data, error } = await client.storage.from(PHOTO_BUCKET).remove([photoPath])
      if (error) throw error
      return { photoPath, photoRemoved: Array.isArray(data) && data.length > 0 }
    } catch {
      return { photoPath, photoRemoved: false }
    }
  },
})
