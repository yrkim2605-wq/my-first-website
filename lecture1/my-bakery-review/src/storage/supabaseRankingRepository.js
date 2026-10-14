import { RepositoryError } from './localStore'
import { isNetworkError } from './supabaseShared'

// 실제 랭킹 저장소 — Supabase 버전이에요 (0005 마이그레이션의 ranking_* 뷰를 읽기만 해요).
//  - 로그인하지 않아도 읽을 수 있고, 아무것도 쓰지 않아요 (읽기 전용 뷰).
//  - 공개 정보만 와요: 닉네임 · 레벨 · EXP · 일지/좋아요 수.
//  - 순위 번호는 서버가 정해요 (동점 규칙은 0005 안내 참고). 이 파일은 계산하지 않고 그대로 보여줘요.
//  - "내 순위"는 로그인했을 때 내 줄을 따로 찾아와요 (상위 10위 밖이어도 전체 기준 순위가 나와요).
//  - 연결에 실패하면 예시 데이터나 로컬 계산으로 대신하지 않고 오류를 던져요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)

export const RANKING_LIMIT = 10

const rankingMessages = {
  NETWORK: '서버에 연결하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  LOAD_FAILED: '순위를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  NOT_SET_UP: '순위 기능이 아직 서버에 설정되지 않았어요. (관리자: 0005_rankings.sql을 적용해 주세요)',
}

const toRankingError = (error) => {
  if (error instanceof RepositoryError) return error
  if (isNetworkError(error)) return new RepositoryError('NETWORK', rankingMessages.NETWORK)
  // 뷰가 아직 없을 때: PostgREST 'PGRST205'(스키마 캐시에 없음) · Postgres '42P01'(없는 표/뷰)
  if (error?.code === 'PGRST205' || error?.code === '42P01' || /could not find the table|does not exist/i.test(String(error?.message ?? ''))) {
    return new RepositoryError('NOT_SET_UP', rankingMessages.NOT_SET_UP)
  }
  return new RepositoryError('LOAD_FAILED', rankingMessages.LOAD_FAILED)
}

// 각 랭킹: 뷰 이름 · 사용자 순위인지 · 화면용 모양으로 바꾸는 함수
const BOARDS = {
  exp: {
    view: 'ranking_exp',
    ofUser: true,
    map: (row) => ({
      rank: Number(row.rank),
      userId: row.user_id,
      nickname: row.nickname,
      exp: Number(row.exp),
      levelIndex: Number(row.level_index ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      discoveredCount: Number(row.discovered_count ?? 0),
    }),
  },
  monthly: {
    view: 'ranking_monthly_reviews',
    ofUser: true,
    map: (row) => ({
      rank: Number(row.rank),
      userId: row.user_id,
      nickname: row.nickname,
      levelIndex: Number(row.level_index ?? 0),
      monthReviewCount: Number(row.month_review_count),
      exp: Number(row.exp ?? 0),
      monthLabel: row.month_label,
    }),
  },
  bakeries: {
    view: 'ranking_bakeries',
    ofUser: false,
    map: (row) => ({
      rank: Number(row.rank),
      bakeryId: row.bakery_id,
      name: row.bakery_name,
      districtId: row.district_id,
      reviewCount: Number(row.review_count),
      avgRating: row.avg_rating == null ? null : Number(row.avg_rating),
    }),
  },
  posts: {
    view: 'ranking_posts',
    ofUser: false,
    map: (row) => ({
      rank: Number(row.rank),
      postId: row.post_id,
      categoryId: row.category_id,
      title: row.title,
      authorId: row.user_id,
      author: row.author_nickname,
      authorLevelIndex: Number(row.author_level_index ?? 0),
      likeCount: Number(row.like_count),
      commentCount: Number(row.comment_count ?? 0),
    }),
  },
}

export const createSupabaseRankingRepository = (getClient) => {
  const currentUserId = async (client) => {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    return data.session?.user?.id ?? null
  }

  return {
    // boardId: 'exp' | 'monthly' | 'bakeries' | 'posts'
    // 돌려주는 값: { items: [상위 10개], me: 로그인한 내 줄 | null }  (me는 사용자 순위에만, 순위에 없으면 null)
    async getBoard(boardId) {
      const board = BOARDS[boardId]
      if (!board) throw new RepositoryError('LOAD_FAILED', rankingMessages.LOAD_FAILED)
      try {
        const client = await getClient()
        const userId = board.ofUser ? await currentUserId(client) : null
        const { data, error } = await client.from(board.view).select('*').order('rank', { ascending: true }).limit(RANKING_LIMIT)
        if (error) throw error
        const items = (data ?? []).map(board.map)

        let me = null
        if (userId) {
          const inTop = items.find((item) => item.userId === userId)
          if (inTop) {
            me = inTop
          } else {
            const { data: mine, error: mineError } = await client.from(board.view).select('*').eq('user_id', userId).maybeSingle()
            if (mineError) throw mineError
            me = mine ? board.map(mine) : null
          }
        }
        return { items, me }
      } catch (error) {
        throw toRankingError(error)
      }
    },
  }
}
