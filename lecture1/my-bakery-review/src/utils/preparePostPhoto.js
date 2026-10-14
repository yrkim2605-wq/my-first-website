import { resizeImageFile } from './resizeImageFile'
import { PHOTO_MAX_BYTES, classifyPhoto } from './photoCheck'

// 게시글에 붙일 사진을 올리기 좋게 준비해요: 항상 JPEG로, 긴 쪽 800px로 줄여요 (서버 저장소는 JPEG/WebP 1MB 이하만 받아요).
// 줄여도 1MB를 넘으면 품질 → 크기를 단계적으로 낮춰 다시 시도하고, 그래도 안 되면 이유를 알려요.
// resize는 시험할 수 있게 바꿔 끼울 수 있어요 (기본: 브라우저 캔버스로 줄이는 resizeImageFile).
const ATTEMPTS = [
  { maxSize: 800, quality: 0.8 },
  { maxSize: 800, quality: 0.6 },
  { maxSize: 640, quality: 0.5 },
]

export const preparePostPhoto = async (file, resize = resizeImageFile) => {
  if (!file || !String(file.type ?? '').startsWith('image/')) throw new Error('사진 파일을 골라 주세요.')
  for (const attempt of ATTEMPTS) {
    let dataUrl
    try {
      dataUrl = await resize(file, attempt)
    } catch {
      throw new Error('이 사진은 읽을 수 없어요. 다른 사진을 골라 주세요.')
    }
    const check = classifyPhoto(dataUrl)
    if (check.ok) return dataUrl
    if (check.bytes <= PHOTO_MAX_BYTES) throw new Error('이 사진은 올릴 수 없는 형식이에요. 다른 사진을 골라 주세요.') // 크기가 아니라 형식 문제
  }
  throw new Error('사진이 너무 커서 줄여도 1MB를 넘어요. 다른 사진을 골라 주세요.')
}
