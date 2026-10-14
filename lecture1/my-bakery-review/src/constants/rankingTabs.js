import { IS_ACCOUNT_MODE } from '../lib/backend'
import { RANKING_TABS } from './ranking'

// 명예의 전당 탭이에요.
//  - 로컬 모드: 예전 5개 탭 (예시 순위표)
//  - 계정 모드: 서버 데이터로 실제 계산할 수 있는 4개 탭만 보여줘요 (id는 supabaseRankingRepository의 랭킹 이름)
//    방문 많은 회원(방문 체크는 나만 보는 기록) · 인기빵집 하트 · 좋아요 많은 리뷰는 서버에 데이터가 없어서 계정 모드에서는 빼요.
export const ACCOUNT_RANKING_TABS = [
  { id: 'exp', label: 'EXP 순위' },
  { id: 'monthly', label: '이번 달 리뷰왕' },
  { id: 'bakeries', label: '리뷰 많은 빵집' },
  { id: 'posts', label: '좋아요 많은 글' },
]

export const ACTIVE_RANKING_TABS = IS_ACCOUNT_MODE ? ACCOUNT_RANKING_TABS : RANKING_TABS
