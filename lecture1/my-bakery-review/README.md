# 🥐 빵덕후 레벨업

부산 빵집을 찾아 다니고, 리뷰를 남기고, 레벨을 올리는 **빵지순례 커뮤니티** 웹사이트예요.
해운대 · 서면 · 남포동 · 광안리 · 동래의 실제 빵집 정보를 카카오 로컬 API로 불러와요.

## 주요 기능

| 페이지 | 내용 |
|---|---|
| **홈** | 히어로 캐러셀, 인기 빵집 · 인기 리뷰 캐러셀, 지역별 빵집 목록 |
| **빵집 상세** | 빵집 정보, 시그니처 메뉴, 방문자 리뷰, 방문 인증 |
| **커뮤니티** | 카테고리 필터 · 정렬, 게시글 상세, 댓글 · 답글 · 추천 |
| **랭킹** | 이번달 리뷰왕, 방문 많은 회원, 인기빵집 TOP 10 등 5개 랭킹 |
| **마이 인벤토리** | 레벨 · 경험치(XP), 획득 배지, 방문한 빵집 기록 |

**레벨 시스템**: 빵린이 → 빵탐험가 → 빵전문가 → 빵마스터 → 빵덕후

> 로그인 · 회원가입은 화면만 있는 데모예요. 리뷰와 게시글은 샘플 데이터이고,
> 방문 인증과 사진은 브라우저(localStorage)에만 저장돼요.

## 사용 기술

- **React 19** + **Vite**
- **MUI (Material UI)**: UI 컴포넌트와 테마 (`src/theme.js`)
- **React Router**: 페이지 이동 (`HashRouter`)
- **Lenis**: 부드러운 스크롤
- **카카오 로컬 API**: 부산 지역 빵집 검색

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/my-first-website/my-bakery-review/` 를 열어요.

### 카카오 API 키 설정

빵집 정보는 카카오 지도 SDK의 장소 검색으로 불러와요. **JavaScript 키**를 써요.
(REST API 키는 브라우저 코드에 넣으면 누구나 가져다 쓸 수 있어서 쓰지 않아요.)

1. [카카오 개발자 콘솔](https://developers.kakao.com/console/app)에서 앱을 고르고 **JavaScript 키**를 복사해요.
2. **플랫폼 → Web**에 사이트 주소를 등록해요. 등록한 주소에서만 키가 동작해요.
   - `https://yrkim2605-wq.github.io`
   - `http://localhost:5173` (개발용)
3. **카카오맵** 서비스를 활성화해요(앱 설정의 제품 설정).
4. 이 폴더에 `.env` 파일을 만들어 키를 넣어요. `.env`는 `.gitignore`에 들어 있어서 GitHub에 올라가지 않아요.

```
VITE_KAKAO_JS_KEY=발급받은_JavaScript_키
```

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 배포용 빌드 (저장소 루트의 `my-bakery-review/` 폴더에 만들어져요) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | 코드 검사 (ESLint) |

## 폴더 구조

```
src/
├── api/          # 카카오 로컬 API 호출
├── assets/       # 이미지(WebP) · 폰트
├── components/
│   ├── common/   # 카드, 캐러셀 등 공통 컴포넌트
│   └── layout/   # 헤더, 푸터, 레이아웃
├── constants/    # 샘플 데이터와 상수 (빵집, 리뷰, 레벨, 배지 등)
├── context/      # 전역 상태 Provider
├── hooks/        # Provider 값을 꺼내 쓰는 hook (useBusanBakeries 등)
├── pages/        # 페이지 컴포넌트
├── utils/        # 도우미 함수
└── theme.js      # MUI 테마 (색상 · 글꼴 · 컴포넌트 스타일)
```
