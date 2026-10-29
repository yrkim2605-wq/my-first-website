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

import logoMitutoyo from '../assets/brand/mitutoyo.png'
import logoDormer from '../assets/brand/dormer.png'
import logoShs from '../assets/brand/shs.png'
import logoSk from '../assets/brand/sk.png'
import logoKanetec from '../assets/brand/kanetec.png'
import logoTohnichi from '../assets/brand/tohnichi.png'

import productMicrometer from '../assets/product/product-micrometer.jpg'
import productHeight from '../assets/product/product-height.jpg'
import productProjector from '../assets/product/product-projector.jpg'
import productBore from '../assets/product/product-bore.jpg'
import productCmm from '../assets/product/product-cmm.jpg'
import productIndicator from '../assets/product/product-indicator.jpg'
import productTest from '../assets/product/product-test.jpg'
import productInterface from '../assets/product/product-interface.jpg'
import productCounter from '../assets/product/product-counter.jpg'

export const HERO_SLIDES = [hero1, hero2, hero3, hero4, hero5, hero6, hero7, hero8]

export const NAV_MENUS = ['온라인견적', '카탈로그', '의뢰/요청', '고객센터', '기술자료']

export const NAV_RIGHT_MENUS = ['개인결제', '주문/배송조회']

// 아이콘은 ServiceStrip 컴포넌트에서 id로 연결
export const CONTACTS = [
  { id: 'tel', title: '1644-9879', desc: '평일 09:00 - 18:00' },
  { id: 'branch', title: '051-714-0949', desc: '부산 지사 문의' },
  { id: 'kakao', title: '빠른 상담', desc: '카카오톡 @(주)덕명눈솔' },
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

// 기존 덕명눈솔 쇼핑몰(mitutoyosquare.com)에 실제로 올라와 있는 상품과 가격 (2026-10-30 확인)
// 인기상품 = 기존 PROMOTION(히트) / 신상품 = 기존 최신상품 / 특가상품 = 기존 추천상품 중 7% 할인 상품
// badges: 기존 사이트의 태그 그대로 (히트, 추천, NEW, 할인율 등)
// price가 null이면 "가격문의"로 표시, originalPrice가 있으면 정가에 취소선 표시
// image가 없으면 회색 플레이스홀더로 표시됨
export const PRODUCTS = {
  인기상품: [
    {
      id: 1,
      badges: ['히트'],
      brand: 'Mitutoyo',
      name: '디지매틱 외측 마이크로-고정도 ,0.1μm',
      price: 1767480,
      image: productMicrometer,
    },
    {
      id: 2,
      badges: ['히트', '추천', 'NEW'],
      brand: 'Mitutoyo',
      name: '리니어 하이트-고성능 2차원측정-에어부상형',
      price: 11165660,
      image: productHeight,
    },
    {
      id: 3,
      badges: ['히트'],
      brand: 'Mitutoyo',
      name: '투영기 PH-3515F 정립상 윤곽형상용(QM/KA카운터 선택)',
      price: 18241080,
      image: productProjector,
    },
    {
      id: 4,
      badges: ['히트'],
      brand: 'Mitutoyo',
      name: '보어 게이지-표준',
      price: 264220,
      image: productBore,
    },
  ],
  신상품: [
    {
      id: 5,
      badges: ['NEW'],
      brand: 'Mitutoyo',
      name: '3차원 측정기 CRYSTA-APEX V9106',
      price: null,
      image: productCmm,
    },
    {
      id: 6,
      badges: ['NEW'],
      brand: 'Mitutoyo',
      name: '디지매틱 인디게이터=바그래프 다기능절환',
      price: 819060,
      image: productIndicator,
    },
    {
      id: 7,
      badges: ['NEW'],
      brand: 'Mitutoyo',
      name: '리니어 하이트-고성능 2차원측정-에어부상형',
      price: 11165660,
      image: productHeight,
    },
    {
      id: 8,
      badges: ['NEW'],
      brand: 'Mitutoyo',
      name: '다이얼 테스트=만능 360˚',
      price: 367400,
      image: productTest,
    },
  ],
  특가상품: [
    {
      id: 9,
      badges: ['추천', '할인', '재고문의'],
      brand: 'Mitutoyo',
      name: '인터페이스 유닛=CC-Link',
      price: 897050,
      originalPrice: 959400,
      discountRate: 7,
      image: productInterface,
    },
    {
      id: 10,
      badges: ['추천', '할인'],
      brand: 'Mitutoyo',
      name: 'EJ 카운터=EJ-102N',
      price: 548900,
      originalPrice: 587100,
      discountRate: 7,
      image: productCounter,
    },
  ],
}

export const BRANDS = [
  { id: 'mitutoyo', logo: 'Mitutoyo', logoImage: logoMitutoyo, name: '미쓰도요' },
  { id: 'dormer', logo: 'DORMER', logoImage: logoDormer, name: '돌머' },
  { id: 'shs', logo: 'SHS', logoImage: logoShs, name: 'SHS' },
  { id: 'sk', logo: 'SK', logoImage: logoSk, name: 'SK' },
  { id: 'kanetec', logo: 'KANETEC', logoImage: logoKanetec, name: '가네텍' },
  { id: 'tohnichi', logo: 'TOHNICHI', logoImage: logoTohnichi, logoHeight: 30, name: '토니치' },
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
  accountNumber: '954601-01-125611',
  kakao: '@(주)덕명눈솔',
  accountHolder: '(주)덕명눈솔',
}

export const FOOTER_LINKS = ['회사소개', '서비스이용약관', '개인정보처리방침', '마이페이지']

export const COMPANY_INTRO = {
  name: '(주)덕명눈솔',
  title: '한국 미쓰도요 공식대리점',
  descriptions: [
    '(주)덕명눈솔은 38년 이상의 노하우를 가진',
    '믿음과 신뢰의 MITUTOYO 한국 공식 대리점 입니다',
  ],
  // 숫자로 보여주는 신뢰 요소 (모두 기존 사이트에 공개된 정보)
  years: '38',
  yearsLabel: '년 이상의 노하우',
}
