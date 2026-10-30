// 페이지를 옮긴 직후에는 화면이 그려질 시간이 필요해서 잠깐 기다렸다가 스크롤함
export const NAVIGATION_SETTLE_MS = 150

export const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
