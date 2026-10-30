# 덕명눈솔 쇼핑 사이트 리디자인

- 레퍼런스(기존 사이트): https://mitutoyosquare.com/shop/
- 목표: 기존 B2B 측정기 쇼핑 사이트를 분석해 새롭게 디자인 (분석 내용은 `사이트 분석.md`)
- 배포 주소: https://yrkim2605-wq.github.io/my-first-website/duckmyeong-nunsol/

> 리디자인 연습용 데모입니다. 상품·회사 정보는 기존 사이트에 공개된 내용을 사용했고, 주문·견적·로그인은 실제로 전송되지 않습니다.

## 기술 스택
React 19 · Vite · MUI v9 · React Router(HashRouter: GitHub Pages는 새로고침 시 404가 나서 `#/` 주소를 사용) · Noto Sans KR

## 주요 기능
| 영역 | 내용 |
|---|---|
| 쇼핑 | 장바구니(수량·합계·새로고침 유지), 찜, 가격문의 상품은 견적 목록에 담기 |
| 온라인견적 (`#/quote`) | ① 제품 찾기(입력하면 바로 필터, 목록에 없는 제품은 직접 입력) ② 담은 제품(수량·삭제) ③ 요청 정보(필수 4개 + 접이식 추가 정보, 형식 검증·전화번호 자동 서식·첨부 파일 검사) + 오른쪽 고정 요약 카드(합계·제출·문의) → 접수 완료 화면 |
| 검색 | 자동완성, 띄어쓰기·대소문자 무시, 여러 단어 검색, 카테고리·브랜드 필터, 전체보기, 빈 결과 안내 |
| 내비게이션 | 호버/클릭/키보드 드롭다운, 전체 카테고리 메뉴, 접이식 모바일 메뉴 |
| 화면 | 히어로 슬라이드(자동재생·스와이프·일시정지), 스크롤 등장 효과, 상담 플로팅 메뉴(전화·계좌 복사) |
| 품질 | 키보드 접근성(건너뛰기 링크·포커스 표시), "동작 줄이기" 설정 존중, 이미지 지연 로딩, 오류 화면, 반응형 |

## 실행
```bash
npm install
npm run dev     # 개발 서버
npm run lint    # 코드 검사
npm run build   # 배포용 빌드
```

## 폴더 구조
```
src/
├── components/
│   ├── common/   # ProductCard, QuantityStepper, Reveal, ErrorBoundary 등 공통
│   ├── home/     # 메인 페이지 섹션
│   ├── layout/   # Header, NavDropdown, MobileMenu, Footer, FloatingMenu
│   ├── quote/    # 온라인견적 페이지 구성 요소
│   └── shop/     # CartDrawer, QuoteDialog
├── context/      # 장바구니·찜·견적 목록 상태(ShopProvider)
├── hooks/        # useShop, useProductFilter, useNavAction, usePageTitle
├── pages/        # HomePage, QuotePage
├── utils/        # 상품 검색, 전화번호 서식, 파일 검사, 스크롤
└── constants/    # 메뉴·상품·회사 정보 데이터
```
