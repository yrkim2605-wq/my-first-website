// 커뮤니티 카테고리 · 랭킹 종류처럼 페이지 안에서 목록을 바꾸는 탭의 공통 스타일이에요.
export const PAGE_TABS_SX = {
  width: '100%',
  minHeight: 44,
  borderBottom: '1px solid rgba(59,42,34,0.12)',
  '& .MuiTab-root': {
    minHeight: 44,
    minWidth: 0,
    px: 0,
    mr: 3,
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'text.secondary',
  },
  '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
  '& .MuiTabs-indicator': { height: 3, borderRadius: 999, bgcolor: 'primary.main' },
}
