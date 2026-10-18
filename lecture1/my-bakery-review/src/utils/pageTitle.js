// 페이지마다 브라우저 탭 제목을 다르게 해요 (탭이 여러 개일 때 구분되고, 북마크 · 검색 결과에도 페이지 이름이 보여요).
// 빵집 상세(/bakery/:id)는 빵집 이름을 알아야 해서 BakeryDetail이 직접 정해요 (null을 돌려줘요).
const SITE = '빵덕후 레벨업'
export const DEFAULT_TITLE = `${SITE} · 부산 빵지순례 커뮤니티`

const EXACT = {
  '/': DEFAULT_TITLE,
  '/community': '모험가 광장',
  '/community/write': '글쓰기',
  '/mypage': '내 모험가 상태창',
  '/ranking': '명예의 전당',
  '/login': '로그인',
  '/signup': '회원가입',
  '/terms': '이용약관',
  '/privacy': '개인정보처리방침',
  '/forgot-password': '비밀번호 찾기',
  '/reset-password': '새 비밀번호',
  '/admin/reports': '신고 처리',
}

export const getPageTitle = (pathname) => {
  if (pathname.startsWith('/bakery/')) return null
  if (EXACT[pathname]) return EXACT[pathname] === DEFAULT_TITLE ? DEFAULT_TITLE : `${EXACT[pathname]} · ${SITE}`
  if (/^\/community\/[^/]+\/edit$/.test(pathname)) return `글 고치기 · ${SITE}`
  if (/^\/community\/[^/]+$/.test(pathname)) return `모험가 광장 글 · ${SITE}`
  return `페이지를 찾을 수 없어요 · ${SITE}`
}

export const bakeryTitle = (name) => `${name} · ${SITE}`
