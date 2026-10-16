// 사진이 없는 빵집의 플레이스홀더 포즈 4종. 같은 빵집은 어디서 보든(카드 · 상세 · 지도 · 마이페이지) 늘 같은 포즈가 나오도록
// 빵집 ID만으로 정해요 (순서나 화면과는 상관없어요).
export const PLACEHOLDER_POSES = ['knightCamera', 'knightMap', 'knightMagnifier', 'knightBook']

// ID 글자들을 섞어서(FNV-1a + 마무리 섞기) 숫자 하나로 만들어요. 카카오 빵집 ID는 비슷한 숫자가 많아서 단순한 계산(예: 31씩 곱하기)은
// 한 포즈로 쏠렸어요. SALT는 현재 빵집 75곳과 예시 1~13번이 네 포즈에 고르게 나뉘도록 골라 둔 고정값이에요 (바꾸면 포즈가 전부 달라져요).
const SALT = 5935

const hashId = (id) => {
  let h = (0x811c9dc5 ^ SALT) >>> 0
  for (const ch of String(id)) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

export const getPlaceholderPose = (id) => PLACEHOLDER_POSES[hashId(id) % PLACEHOLDER_POSES.length]
