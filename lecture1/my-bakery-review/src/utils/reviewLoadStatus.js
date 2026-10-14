// 내 기록(리뷰)을 서버에서 불러오는 상태를 화면이 쓰기 쉬운 값으로 정리해요.
//  - 계정 모드에서 로그인한 상태일 때만 의미가 있어요 (로컬 모드 · 로그아웃은 항상 isLoading false, loadError null).
//  - isLoading : 아직 한 번도 못 불러왔거나, 다른 계정으로 바뀐 뒤 그 계정 기록을 아직 못 불러온 상태
//  - loadError : 불러오기에 실패한 이유 (불러오는 중에는 이전 실패 문구를 보여주지 않아요)
export const getReviewLoadStatus = ({ isAccountMode, userId, loaded, loadedUserId, loadError }) => {
  if (!isAccountMode || !userId) return { isLoading: false, loadError: null }
  const isLoading = !loaded || loadedUserId !== userId
  return { isLoading, loadError: isLoading ? null : loadError || null }
}
