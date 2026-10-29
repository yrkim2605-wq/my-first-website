import hero1 from '../assets/hero/hero1.jpg'
import hero2 from '../assets/hero/hero2.jpg'
import hero3 from '../assets/hero/hero3.jpg'
import hero4 from '../assets/hero/hero4.jpg'
import hero5 from '../assets/hero/hero5.jpg'
import hero6 from '../assets/hero/hero6.jpg'
import hero7 from '../assets/hero/hero7.jpg'
import hero8 from '../assets/hero/hero8.jpg'

import optical from '../assets/category/optical.jpg'
import reference from '../assets/category/reference.jpg'
import bore from '../assets/category/bore.jpg'
import height from '../assets/category/height.jpg'
import micrometer from '../assets/category/micrometer.jpg'
import indicator from '../assets/category/indicator.jpg'
import equipment from '../assets/category/equipment.jpg'
import caliper from '../assets/category/caliper.jpg'

export const HERO_SLIDES = [hero1, hero2, hero3, hero4, hero5, hero6, hero7, hero8]

export const NAV_MENUS = ['온라인견적', '카탈로그', '의뢰/요청', '고객센터', '기술자료']

export const NAV_RIGHT_MENUS = ['개인결제', '주문/배송조회']

// 아이콘은 ServiceStrip 컴포넌트에서 id로 연결
export const CONTACTS = [
  { id: 'tel', title: '1644-9879', desc: '평일 09:00 - 18:00' },
  { id: 'branch', title: '051-714-0949', desc: '부산 지사 문의' },
  { id: 'kakao', title: '빠른 상담', desc: '카카오톡 @덕명눈솔' },
  { id: 'order', title: '주문/배송조회', desc: '실시간 확인 가능' },
]

export const CATEGORIES = [
  { id: 'equipment', name: '측정장비', image: equipment },
  { id: 'optical', name: '광학측정', image: optical },
  { id: 'caliper', name: '캘리퍼스측정', image: caliper },
  { id: 'micrometer', name: '외측마이크로미터', image: micrometer },
  { id: 'indicator', name: '인디케이터측정', image: indicator },
  { id: 'bore', name: '내측/보어측정', image: bore },
  { id: 'height', name: '높이/깊이측정', image: height },
  { id: 'reference', name: '기준/규범측정', image: reference },
]

export const PRODUCT_TABS = ['인기상품', '신상품', '특가상품']

// 기존 덕명눈솔 쇼핑몰(mitutoyosquare.com)에 실제로 올라와 있는 상품과 가격 (2026-10-29 확인)
// 인기상품 = 기존 PROMOTION(히트) / 신상품 = 기존 최신상품 / 특가상품 = 기존 할인 상품
// price가 null이면 "가격문의"로 표시, originalPrice가 있으면 정가에 취소선 표시
// 사진 파일이 생기면 상품에 image를 추가하면 회색 플레이스홀더 대신 표시됨
export const PRODUCTS = {
  인기상품: [
    { id: 1, badge: 'BEST', brand: 'Mitutoyo', name: '디지매틱 외측 마이크로미터-고정도, 0.1㎛', price: 1767480 },
    { id: 2, badge: 'BEST', brand: 'Mitutoyo', name: '리니어 하이트-고성능 2차원측정-에어부상형', price: 11165660 },
    { id: 3, badge: 'BEST', brand: 'Mitutoyo', name: '투영기 PH-3515F 정립상 윤곽형상용(QM/KA카운터 선택)', price: 18241080 },
    { id: 4, badge: 'BEST', brand: 'Mitutoyo', name: '보어 게이지-표준', price: 264220 },
  ],
  신상품: [
    { id: 5, badge: 'NEW', brand: 'Mitutoyo', name: '3차원 측정기 CRYSTA-APEX V9106', price: null },
    { id: 6, badge: 'NEW', brand: 'Mitutoyo', name: '디지매틱 인디게이터=바그래프 다기능절환', price: 819060 },
    { id: 7, badge: 'NEW', brand: 'Mitutoyo', name: '리니어 하이트-고성능 2차원측정-에어부상형', price: 11165660 },
    { id: 8, badge: 'NEW', brand: 'Mitutoyo', name: '다이얼 테스트=만능 360˚', price: 367400 },
  ],
  특가상품: [
    { id: 9, badge: '7% 할인', brand: 'Mitutoyo', name: '디지매틱배터리-Mitutoyo정품', price: 5390 },
    { id: 10, badge: '7% 할인', brand: 'Mitutoyo', name: '인터페이스 유닛=CC-Link', price: 897050, originalPrice: 959400 },
    { id: 11, badge: '7% 할인', brand: 'Mitutoyo', name: 'EJ 카운터=EJ-102N', price: 548900, originalPrice: 587100 },
  ],
}

export const BRANDS = [
  { id: 'mitutoyo', logo: 'Mitutoyo', name: '미쓰도요' },
  { id: 'dormer', logo: 'DORMER', name: '돌머' },
  { id: 'shs', logo: 'SHS', name: 'SHS' },
  { id: 'sk', logo: 'SK', name: 'SK' },
  { id: 'kanetec', logo: 'KANETEC', name: '가네텍' },
  { id: 'tohnichi', logo: 'TOHNICHI', name: '토니치' },
]

// 기존 덕명눈솔 쇼핑몰(mitutoyosquare.com) 푸터와 헤더에 공개된 정보 그대로
export const COMPANY_INFO = {
  name: '(주)덕명눈솔',
  ceo: '정상권',
  businessNumber: '605-81-24354',
  salesNumber: '2020-부산해운대-0200',
  address: '부산 해운대구 센텀중앙로 97 3801, 3802, 3803호 (재송동, 센텀스카이비즈)',
  email: 'shop@duckmyoung.com',
  tel: '1644-9879',
  branchTel: '051-714-0949',
  fax: '051-775-9622',
  hours: '평일 09:00 ~ 18:00 (일요일·공휴일 휴무)',
  bank: '국민은행 954601-01-125611',
  accountHolder: '(주)덕명눈솔',
}

export const FOOTER_LINKS = ['회사소개', '서비스이용약관', '개인정보처리방침', '마이페이지']
