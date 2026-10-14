import { RepositoryError } from './localStore'
import { PHOTO_MAX_BYTES, classifyPhoto } from '../utils/photoCheck'
import { isNetworkError } from './supabaseShared'
import { AUTH_NETWORK_MESSAGE } from './authMessages'

// 게시글 사진을 서버 사진 저장소(photos 버킷)에 올리고 · 지우고 · 정리 실패를 기록하는 도우미예요.
//  - 경로 규칙: "{내 user_id}/{무작위 이름}.jpg" (서버 정책이 내 폴더만 허용해요 — 0003)
//  - 파일 이름은 매번 새로 만들어요(덮어쓰지 않아요). 교체는 "새 파일 올리기 → 글 수정 → 옛 파일 지우기" 순서예요.
//  - 지우기는 "정말 지워졌는지"를 확인해요. 서버가 오류 없이 0건만 처리하는 경우(읽기 정책이 없을 때 등)도 실패로 보고 기록해요.
//  - 지우지 못한 파일은 이 브라우저에 기록해 두고(남은 파일 확인용), 다음에 다시 정리를 시도해요.

export const PHOTO_BUCKET = 'photos'

export const photoMessages = {
  PHOTO_FAILED: '사진을 올리지 못했어요. 작성한 글은 그대로 남아 있어요. 다시 시도하거나, 사진 없이 글만 저장할 수 있어요.',
  INVALID_PHOTO: '이 사진은 올릴 수 없어요. JPEG 또는 WebP 사진이어야 하고 1MB 이하여야 해요.',
}

const newPhotoName = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob()
export const isRemoteUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value)

// 올리기 전 점검 (형식 · 크기). 맞지 않으면 서버에 아무것도 보내지 않고 오류를 던져요.
export const assertUploadablePhoto = (photo) => {
  const check = classifyPhoto(photo)
  if (!check.ok) {
    const detail = check.bytes > PHOTO_MAX_BYTES ? ` (현재 ${(check.bytes / 1048576).toFixed(1)}MB)` : ''
    throw new RepositoryError('INVALID_PHOTO', `${photoMessages.INVALID_PHOTO}${detail}`)
  }
}

export const getPhotoUrl = (client, path) => (path ? client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl : null)

// 사진 올리기: 성공하면 저장 경로를 돌려줘요. 실패하면 PHOTO_FAILED(연결 문제는 NETWORK)를 던져요.
export const uploadPhoto = async (client, userId, photoDataUrl) => {
  assertUploadablePhoto(photoDataUrl)
  const path = `${userId}/${newPhotoName()}.jpg`
  try {
    const blob = await dataUrlToBlob(photoDataUrl)
    const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
    if (error) throw error
    return path
  } catch (error) {
    if (isNetworkError(error)) throw new RepositoryError('NETWORK', AUTH_NETWORK_MESSAGE)
    throw new RepositoryError('PHOTO_FAILED', photoMessages.PHOTO_FAILED)
  }
}

// ── 지우지 못한 파일 기록 (이 브라우저, 계정별) ──
const orphanKey = (userId) => `my-bakery-review:v1:orphan-photos:${userId}`
const readOrphans = (userId, storage) => {
  try {
    const parsed = JSON.parse(storage.getItem(orphanKey(userId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.path === 'string') : []
  } catch {
    return []
  }
}
const writeOrphans = (userId, items, storage) => {
  try {
    if (items.length === 0) storage.removeItem(orphanKey(userId))
    else storage.setItem(orphanKey(userId), JSON.stringify(items))
  } catch {
    // 기록하지 못해도 글 저장 · 삭제에는 영향을 주지 않아요
  }
}
export const listOrphanPhotos = (userId, storage = globalThis.localStorage) => (storage && userId ? readOrphans(userId, storage) : [])
export const recordOrphanPhoto = (userId, path, reason, storage = globalThis.localStorage) => {
  if (!storage || !userId || !path) return
  const items = readOrphans(userId, storage).filter((item) => item.path !== path)
  writeOrphans(userId, [...items, { path, reason: String(reason ?? '').slice(0, 200), at: new Date().toISOString() }], storage)
}
const forgetOrphanPhoto = (userId, path, storage) => writeOrphans(userId, readOrphans(userId, storage).filter((item) => item.path !== path), storage)

// 사진 파일 하나 지우기. 돌려주는 값: { ok, reason }
//  ok=true : 서버가 실제로 지웠다고 확인해 줬어요.
//  ok=false: 오류가 났거나, 오류 없이 0건만 처리됐어요 → 남은 파일로 기록해요 (recordOrphanPhoto)
export const removePhotoFile = async (client, userId, path, storage = globalThis.localStorage) => {
  if (!path) return { ok: true, reason: null }
  try {
    const { data, error } = await client.storage.from(PHOTO_BUCKET).remove([path])
    if (error) throw error
    if (!Array.isArray(data) || data.length === 0) {
      const reason = '서버가 파일을 지웠다고 확인해 주지 않았어요 (권한 또는 이미 없는 파일)'
      recordOrphanPhoto(userId, path, reason, storage)
      return { ok: false, reason }
    }
    forgetOrphanPhoto(userId, path, storage)
    return { ok: true, reason: null }
  } catch (error) {
    const reason = String(error?.message ?? '알 수 없는 오류').slice(0, 200)
    recordOrphanPhoto(userId, path, reason, storage)
    return { ok: false, reason }
  }
}

// 지난번에 못 지운 파일을 다시 정리해 봐요. 돌려주는 값: 아직 남은 파일 목록
export const retryOrphanCleanup = async (client, userId, storage = globalThis.localStorage) => {
  for (const item of listOrphanPhotos(userId, storage)) await removePhotoFile(client, userId, item.path, storage)
  return listOrphanPhotos(userId, storage)
}
