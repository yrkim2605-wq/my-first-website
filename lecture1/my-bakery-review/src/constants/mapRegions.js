// 홈 지도의 지역 버튼이 이동할 지도 시점이에요. (빵집 데이터가 아니라 지도 중심 좌표 · 확대 수준)
// level: 카카오맵 확대 수준 (숫자가 작을수록 가까이)
export const MAP_REGIONS = [
  { id: 'all', label: '부산 전체', lat: 35.1631, lng: 129.0905, level: 8 },
  { id: 'seomyeon', label: '서면', lat: 35.1578, lng: 129.0598, level: 4 }, // 서면역 일대
  { id: 'jeonpo', label: '전포', lat: 35.1556, lng: 129.0649, level: 3 }, // 전포 카페거리
  { id: 'gwangalli', label: '광안리', lat: 35.1535, lng: 129.1186, level: 4 }, // 광안리 해변
  { id: 'haeundae', label: '해운대', lat: 35.1594, lng: 129.1602, level: 4 }, // 해운대 해변
]

export const DEFAULT_MAP_REGION_ID = 'all'
