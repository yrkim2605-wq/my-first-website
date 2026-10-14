// 서버 사진 저장소(photos 버킷, 0003_storage.sql)가 받는 사진인지 올리기 전에 점검해요.
//  - 형식: JPEG 또는 WebP
//  - 크기: 1MB 이하 (앱은 올리기 전에 800px JPEG로 줄여서 보통 수십~수백 KB예요)
// 저장소(서버)가 한 번 더 막지만, 올리기 전에 알면 불필요한 요청을 하지 않고 이유를 정확히 알려줄 수 있어요.

export const PHOTO_MAX_BYTES = 1048576
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/webp']

// data URL("data:image/jpeg;base64,….")을 점검해요.
// 돌려주는 값: { hasPhoto, ok, reason, bytes } — ok가 false이면 reason에 사용자에게 보여줄 이유가 있어요.
export const classifyPhoto = (photo) => {
  if (!photo) return { hasPhoto: false, ok: false, reason: null, bytes: 0 }
  if (typeof photo !== 'string' || !photo.startsWith('data:')) {
    return { hasPhoto: true, ok: false, reason: '사진을 읽을 수 없어서 글만 가져와요', bytes: 0 }
  }
  const comma = photo.indexOf(',')
  const header = comma < 0 ? '' : photo.slice(5, comma)
  const mime = header.split(';')[0]
  const payload = comma < 0 ? '' : photo.slice(comma + 1)
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  const bytes = Math.max(Math.floor((payload.length * 3) / 4) - padding, 0)
  if (!header.includes(';base64') || !payload) return { hasPhoto: true, ok: false, reason: '사진 형식을 읽을 수 없어서 글만 가져와요', bytes }
  if (!PHOTO_ALLOWED_TYPES.includes(mime)) {
    return { hasPhoto: true, ok: false, reason: `사진 형식(${mime || '알 수 없음'})을 서버 저장소가 받지 않아서 글만 가져와요 (JPEG · WebP만 가능)`, bytes }
  }
  if (bytes > PHOTO_MAX_BYTES) {
    return { hasPhoto: true, ok: false, reason: `사진이 ${(bytes / 1048576).toFixed(1)}MB라서 서버 저장소 제한(1MB)을 넘어 글만 가져와요`, bytes }
  }
  return { hasPhoto: true, ok: true, reason: null, bytes }
}
