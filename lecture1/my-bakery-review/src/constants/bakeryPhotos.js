// 빵집 사진 정책
//  - "빵집 사진"은 그 빵집 리뷰에 실제로 붙은 사진만 보여줘요 (RealBakeryPhotosContext가 가장 최근 리뷰 사진을 골라 줘요).
//  - 사진이 없거나 불러오지 못하면 빵 기사 플레이스홀더를 보여줘요 (components/common/BakeryPhoto.jsx).
//  - 예전에 대표 사진처럼 쓰던 스톡 사진 7장(assets/bakery-photos)은 더 이상 어디에서도 쓰지 않아요.
export const getBakeryReviewPhoto = (id, uploadedPhotos = {}) => uploadedPhotos[id] || null
