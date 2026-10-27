// 사이트 전체에서 쓰는 고정 데이터 (닥터에버스 부산서면점 공개 정보 기준)
export const CLINIC = {
  name: '닥터에버스의원 부산서면점',
  ceo: '김홍석',
  address: '부산광역시 부산진구 가야대로 772, 롯데호텔 부산 7층',
  phone: '051-710-7508',
  fax: '051-710-7509',
  businessNumber: '768-03-03384',
  hours: [
    { label: '평일', time: 'AM 09:00 - PM 08:00' },
    { label: '주말', time: 'AM 09:00 - PM 04:30' },
  ],
  hoursNote: '※ 점심시간 없음',
}

export const NAV_ITEMS = [
  { label: '이벤트', target: 'treatment' },
  { label: '시술전후', target: 'before-after' },
  { label: '의료진', target: 'special' },
  { label: '지점안내', target: 'clinic' },
]

export const BEST_SELLERS = [
  {
    id: 'potenza',
    badge: 'BEST 01',
    name: 'POTENZA',
    title: '포텐자',
    description: '모공과 흉터, 피부 결을 한 번에 케어하는 인기 시술이에요.',
  },
  {
    id: 'cerf',
    badge: 'BEST 02',
    name: 'CERF',
    title: '세르프',
    description: '피부 겉과 속을 함께 관리하는 탄력 시술이에요.',
  },
  {
    id: 'density',
    badge: 'BEST 03',
    name: 'DENSITY',
    title: '덴서티',
    description: '처진 윤곽과 밀도를 채워 주는 리프팅 시술이에요.',
  },
]

export const SPECIALS = [
  {
    id: 'plan',
    eyebrow: 'Personalized Care',
    title: '세심한 진료와 맞춤 솔루션',
    points: [
      '얼굴 구조와 피부를 정밀 분석한 맞춤 진료 계획',
      '끊임없는 연구와 지속적인 노하우 축적',
      '꼼꼼한 크림마취와 냉각요법으로 통증 완화',
    ],
  },
  {
    id: 'safety',
    eyebrow: 'Safety & Trust',
    title: '안전과 신뢰를 위한 진료 원칙',
    points: [
      '검증된 장비·의약품을 사용하는 정품·정량 시술',
      '철저한 위생과 안전 관리',
      '가격 투명 공개와 프라이버시가 보호되는 독립 진료 환경',
    ],
  },
]

export const BEFORE_AFTER_TABS = [
  { id: 'acne', label: '여드름', caption: '여드름 시술 전후 비교' },
  { id: 'pore', label: '모공', caption: '모공 시술 전후 비교' },
  { id: 'pigment', label: '색소', caption: '색소 시술 전후 비교' },
  { id: 'wrinkle', label: '주름', caption: '주름 시술 전후 비교' },
  { id: 'lifting', label: '탄력', caption: '탄력 시술 전후 비교' },
]
