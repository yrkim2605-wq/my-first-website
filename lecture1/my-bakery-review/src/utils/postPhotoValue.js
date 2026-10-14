// 글쓰기 · 고치기 화면이 서버(저장소)에 보낼 "사진 값"을 정해요.
//   저장소의 약속: 값이 data URL이면 그 사진으로 올림/교체, null이면 사진 없음/빼기, undefined이면 사진은 그대로(고치기만)
//
//  mode          : 'write'(새 글) | 'edit'(고치기)
//  newPhoto      : 새로 고른 사진(data URL) 또는 null
//  removeExisting: 고치기에서 기존 사진을 빼기로 했는지
//  skipPhoto     : 사진 올리기에 실패해서 "사진 없이 글만 저장"(고치기에서는 "사진은 그대로 두고 글만 고치기")을 고른 경우
export const resolvePhotoValue = ({ mode, newPhoto, removeExisting = false, skipPhoto = false }) => {
  if (skipPhoto) return mode === 'edit' ? undefined : null // 새로 고른 사진은 버리고, 고치기라면 기존 사진은 그대로 둬요
  if (newPhoto) return newPhoto
  if (mode === 'edit') return removeExisting ? null : undefined
  return null
}
