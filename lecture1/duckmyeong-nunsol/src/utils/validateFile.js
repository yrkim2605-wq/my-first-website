export const MAX_FILE_SIZE_MB = 5
export const ALLOWED_FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx']

// 첨부 파일 검사: 문제가 없으면 빈 문자열, 있으면 사용자에게 보여줄 안내 문구를 돌려줌
export const validateFile = (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return `${ALLOWED_FILE_EXTENSIONS.join(', ')} 파일만 올릴 수 있어요`
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 해요`
  }
  return ''
}
