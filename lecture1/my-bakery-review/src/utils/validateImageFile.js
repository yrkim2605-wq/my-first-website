// 리뷰에 붙일 사진을 고른 직후, 브라우저에서 하는 점검이에요 (이미지 줄이기 전).
//  - 형식: JPG · PNG · WebP만. 파일 이름이나 "형식 표시"만 믿지 않고 파일 맨 앞 바이트(고유 표식)도 확인해요.
//    (이름만 .jpg인 문서 · GIF · HEIC · SVG 같은 건 걸러져요)
//  - 크기: 원본 파일 10MB 이하. 너무 큰 파일을 통째로 읽다가 브라우저가 느려지는 걸 막아요.
//    통과한 사진은 resizeImageFile이 800px JPEG로 줄여서(보통 수십~수백 KB) 서버 규칙(1MB)에 맞춰요.
// ⚠️ 이건 "실수와 잘못된 파일"을 막는 안내용 점검이에요. 사진 내용이 적절한지는 판단하지 못해요.

export const REVIEW_PHOTO_MAX_FILE_BYTES = 10 * 1024 * 1024
export const REVIEW_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
export const REVIEW_PHOTO_HINT = 'JPG · PNG · WebP, 10MB 이하'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const FORMAT_MESSAGE = 'JPG, PNG, WebP 사진만 올릴 수 있어요.'

const startsWith = (bytes, signature, offset = 0) => signature.every((value, index) => bytes[offset + index] === value)

// 파일 맨 앞 12바이트로 실제 형식을 알아내요. 모르면 null.
export const sniffImageType = async (file) => {
  if (!file || typeof file.slice !== 'function') return null
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  // WebP: "RIFF" + (크기 4바이트) + "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  return null
}

const formatName = (mime) => String(mime ?? '').replace('image/', '').toUpperCase()

// 돌려주는 값: { ok: true, type } 또는 { ok: false, message } (message는 사용자에게 그대로 보여줘도 돼요)
export const validateImageFile = async (file) => {
  if (!file) return { ok: false, message: '사진 파일을 골라 주세요.' }
  if (!(file.size > 0)) return { ok: false, message: '비어 있는 파일이에요. 다른 사진을 골라 주세요.' }
  if (file.size > REVIEW_PHOTO_MAX_FILE_BYTES) {
    const megabytes = (file.size / 1048576).toFixed(1)
    return { ok: false, message: `사진이 너무 커요 (${megabytes}MB). ${REVIEW_PHOTO_MAX_FILE_BYTES / 1048576}MB 이하 사진을 골라 주세요.` }
  }
  // 브라우저가 알려준 형식이 있고 허용 목록에 없으면 거절 (GIF · HEIC · SVG · BMP 등)
  const declared = String(file.type ?? '').toLowerCase()
  if (declared && !ALLOWED_MIME.includes(declared)) {
    return { ok: false, message: `${FORMAT_MESSAGE} (고른 파일: ${declared.startsWith('image/') ? formatName(declared) : '사진이 아닌 파일'})` }
  }
  // 파일 속 실제 형식 확인: 이름이나 표시만 사진인 파일을 걸러요. 표시와 달라도 내용이 JPG · PNG · WebP면 통과해요.
  let sniffed
  try {
    sniffed = await sniffImageType(file)
  } catch {
    return { ok: false, message: '파일을 읽을 수 없어요. 다른 사진을 골라 주세요.' }
  }
  if (!sniffed) return { ok: false, message: `${FORMAT_MESSAGE} (사진 파일이 아니거나 지원하지 않는 형식이에요)` }
  return { ok: true, type: sniffed }
}
