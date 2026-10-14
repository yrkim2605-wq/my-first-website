import { RepositoryError } from './localStore'
import { messages, toReviewError } from './supabaseShared'

// 커뮤니티(게시글 · 댓글 · 좋아요) 저장소 — Supabase 버전이에요 (posts · comments · post_likes 표).
//  - 읽기는 누구나(비로그인 포함), 쓰기는 이메일 인증을 마친 로그인 사용자만 할 수 있어요 (서버 권한으로 보장돼요).
//  - 글은 작성자만 고치고 지울 수 있어요. 댓글은 작성 · 삭제만 되고 수정은 없어요. 좋아요는 계정당 글 1개에 1번이에요.
//  - 작성자 · 작성일은 서버가 정해요. 이 파일은 글 내용(카테고리 · 제목 · 본문)만 보내요.
//  - 글 · 댓글 · 좋아요는 EXP · 레벨에 영향을 주지 않아요.
//  - 연결에 실패하면 로컬에 대신 저장하지 않고 오류를 던져요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)

export const POST_TITLE_MAX = 80
export const POST_CONTENT_MAX = 2000
export const COMMENT_CONTENT_MAX = 500
// 글 목록은 20개씩 "더 보기"로 이어서 불러와요 (한 번에 많이 받지 않아요)
export const POST_PAGE_SIZE = 20
export const COMMENT_LIST_LIMIT = 500

const CATEGORY_IDS = ['today-visit', 'new-menu', 'open-run', 'recommend', 'photo']

// 정렬 기준 → 서버 정렬 칸 (같으면 최신순)
const SORT_COLUMN = { latest: 'created_at', heart: 'like_count', comment: 'comment_count' }

const communityMessages = {
  DAILY_LIMIT: '오늘은 너무 많이 남겼어요 (하루 글 10개 · 댓글 50개 · 좋아요 200개까지). 내일 다시 해 주세요.',
  INVALID_INPUT: '제목은 1~80자, 내용은 1~2000자, 댓글은 1~500자로 써 주세요.',
  POST_NOT_FOUND: '글을 찾을 수 없어요. 이미 지워졌을 수 있어요.',
  COMMENT_NOT_FOUND: '댓글을 찾을 수 없어요. 이미 지워졌을 수 있어요.',
  FORBIDDEN: '내가 쓴 글과 댓글만 고치거나 지울 수 있어요.',
}

// Supabase / 저장소 오류 → 사용자에게 보여줄 한국어 안내 (커뮤니티 전용 문구를 먼저 보고, 나머지는 공통 처리)
const toCommunityError = (error) => {
  if (error instanceof RepositoryError) return error
  const text = String(error?.message ?? '')
  if (/DAILY_LIMIT/.test(text)) return new RepositoryError('DAILY_LIMIT', communityMessages.DAILY_LIMIT)
  if (error?.code === '23514') return new RepositoryError('INVALID_INPUT', communityMessages.INVALID_INPUT)
  if (error?.code === '23503') return new RepositoryError('POST_NOT_FOUND', communityMessages.POST_NOT_FOUND)
  const common = toReviewError(error)
  // 공통 문구는 "일지" 이야기라서 커뮤니티에서는 맞는 문구로 바꿔요
  if (common.code === 'FORBIDDEN') return new RepositoryError('FORBIDDEN', communityMessages.FORBIDDEN)
  return common
}

const validatePost = ({ categoryId, title, content }) => {
  const cleanTitle = String(title ?? '').trim()
  const cleanContent = String(content ?? '').trim()
  if (!CATEGORY_IDS.includes(categoryId)) throw new RepositoryError('INVALID_INPUT', '카테고리를 골라 주세요.')
  if (!cleanTitle) throw new RepositoryError('INVALID_INPUT', '제목을 입력해 주세요.')
  if (cleanTitle.length > POST_TITLE_MAX) throw new RepositoryError('INVALID_INPUT', `제목은 ${POST_TITLE_MAX}자까지 쓸 수 있어요.`)
  if (!cleanContent) throw new RepositoryError('INVALID_INPUT', '내용을 입력해 주세요.')
  if (cleanContent.length > POST_CONTENT_MAX) throw new RepositoryError('INVALID_INPUT', `내용은 ${POST_CONTENT_MAX}자까지 쓸 수 있어요.`)
  return { category_id: categoryId, title: cleanTitle, content: cleanContent }
}

const validateComment = (rawContent) => {
  const content = String(rawContent ?? '').trim()
  if (!content) throw new RepositoryError('INVALID_INPUT', '댓글 내용을 입력해 주세요.')
  if (content.length > COMMENT_CONTENT_MAX) throw new RepositoryError('INVALID_INPUT', `댓글은 ${COMMENT_CONTENT_MAX}자까지 쓸 수 있어요.`)
  return content
}

const toPost = (row, myUserId) => ({
  id: row.id,
  categoryId: row.category_id,
  title: row.title,
  content: row.content,
  authorId: row.user_id,
  author: row.author_nickname,
  authorLevelIndex: Number(row.author_level_index ?? 0),
  heartCount: Number(row.like_count ?? 0),
  commentCount: Number(row.comment_count ?? 0),
  likedByMe: Boolean(row.liked_by_me),
  isMine: Boolean(myUserId) && row.user_id === myUserId,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toComment = (row) => ({
  id: row.id,
  postId: row.post_id,
  parentId: row.parent_id,
  authorId: row.user_id,
  author: row.author_nickname,
  authorLevelIndex: Number(row.author_level_index ?? 0),
  content: row.content,
  isMine: Boolean(row.is_mine),
  createdAt: row.created_at,
})

export const createSupabaseCommunityRepository = (getClient) => {
  // 로그인한 사용자 ID (로그인하지 않았으면 null — 읽기에는 필요 없어요)
  const currentUserId = async (client) => {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    return data.session?.user?.id ?? null
  }
  const requireUserId = async (client) => {
    const userId = await currentUserId(client)
    if (!userId) throw new RepositoryError('NOT_SIGNED_IN', messages.NOT_SIGNED_IN)
    return userId
  }

  return {
    // 글 목록 한 쪽: { categoryId?: 'all'|카테고리, sortBy?: 'latest'|'heart'|'comment', offset?: 이미 받은 글 수, limit?: 쪽 크기 }
    // 돌려주는 값: { posts, hasMore(다음 쪽이 있는지), total(조건에 맞는 전체 글 수) }
    // 정렬은 "기준 → 최신순 → 글 ID순"까지 정해서, 좋아요 수나 작성 시각이 같아도 순서가 늘 같아요 (쪽을 넘겨도 겹치거나 빠지지 않아요).
    // 한 건 더 받아서 다음 쪽이 있는지 알아내요.
    async listPosts({ categoryId = 'all', sortBy = 'latest', offset = 0, limit = POST_PAGE_SIZE } = {}) {
      try {
        const client = await getClient()
        const myUserId = await currentUserId(client)
        let query = client.from('post_feed').select('*', { count: 'exact' })
        if (categoryId !== 'all') query = query.eq('category_id', categoryId)
        const column = SORT_COLUMN[sortBy] ?? SORT_COLUMN.latest
        if (column !== 'created_at') query = query.order(column, { ascending: false })
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false })
        const { data, error, count } = await query.range(offset, offset + limit) // limit + 1개 (맨 끝 1개는 "더 있는지" 확인용)
        if (error) throw error
        const rows = data ?? []
        return { posts: rows.slice(0, limit).map((row) => toPost(row, myUserId)), hasMore: rows.length > limit, total: Number.isFinite(count) ? count : null }
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 글 하나. 없으면 null이에요 (오류가 아니에요 — 화면이 "글을 찾을 수 없어요"를 보여줘요).
    async getPost(postId) {
      try {
        const client = await getClient()
        const myUserId = await currentUserId(client)
        const { data, error } = await client.from('post_feed').select('*').eq('id', String(postId)).maybeSingle()
        if (error) throw error
        return data ? toPost(data, myUserId) : null
      } catch (error) {
        // 주소가 UUID 모양이 아니면 서버가 거부해요 → 없는 글로 취급
        if (error?.code === '22P02') return null
        throw toCommunityError(error)
      }
    },

    // 글쓰기. 저장에 성공한 새 글 ID를 돌려줘요.
    async createPost(input) {
      const payload = validatePost(input)
      try {
        const client = await getClient()
        await requireUserId(client)
        const { data, error } = await client.from('posts').insert(payload).select('id').single()
        if (error) throw error
        return data.id
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 내 글 고치기. 작성자 · 작성일은 바뀌지 않아요 (서버가 막아요).
    async updatePost(postId, input) {
      const payload = validatePost(input)
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { data, error } = await client.from('posts').update(payload).eq('id', String(postId)).eq('user_id', userId).select('id')
        if (error) throw error
        // 한 줄도 바뀌지 않았다면 없는 글이거나 내 글이 아니에요
        if (!data || data.length === 0) throw new RepositoryError('POST_NOT_FOUND', communityMessages.POST_NOT_FOUND)
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 내 글 지우기 (댓글 · 좋아요도 함께 지워져요). 이미 없어도 성공이에요.
    async deletePost(postId) {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { error } = await client.from('posts').delete().eq('id', String(postId)).eq('user_id', userId)
        if (error) throw error
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 글의 댓글 (오래된 순). 최상위 댓글에 답글(replies)이 붙은 모양으로 돌려줘요.
    async listComments(postId) {
      try {
        const client = await getClient()
        const { data, error } = await client
          .from('comment_feed')
          .select('*')
          .eq('post_id', String(postId))
          .order('created_at', { ascending: true })
          .limit(COMMENT_LIST_LIMIT)
        if (error) throw error
        const all = (data ?? []).map(toComment)
        const topLevel = all.filter((comment) => !comment.parentId).map((comment) => ({ ...comment, replies: [] }))
        const byId = new Map(topLevel.map((comment) => [comment.id, comment]))
        all.filter((comment) => comment.parentId).forEach((reply) => byId.get(reply.parentId)?.replies.push(reply))
        return topLevel
      } catch (error) {
        if (error?.code === '22P02') return []
        throw toCommunityError(error)
      }
    },

    // 댓글 · 답글 쓰기 (parentId가 있으면 답글). 수정 기능은 없어요.
    async addComment({ postId, content, parentId = null }) {
      const cleanContent = validateComment(content)
      try {
        const client = await getClient()
        await requireUserId(client)
        const payload = { post_id: String(postId), content: cleanContent }
        if (parentId) payload.parent_id = String(parentId)
        const { error } = await client.from('comments').insert(payload)
        if (error) throw error
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 내 댓글 지우기 (달린 답글도 함께 지워져요). 이미 없어도 성공이에요.
    async deleteComment(commentId) {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { error } = await client.from('comments').delete().eq('id', String(commentId)).eq('user_id', userId)
        if (error) throw error
      } catch (error) {
        throw toCommunityError(error)
      }
    },

    // 좋아요 켜기 / 끄기. 이미 눌렀는데 또 켜도 성공이에요.
    async setLike(postId, liked) {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        if (liked) {
          const { error } = await client.from('post_likes').insert({ post_id: String(postId) })
          if (error && error.code !== '23505') throw error // 23505 = 이미 눌렀음
        } else {
          const { error } = await client.from('post_likes').delete().eq('post_id', String(postId)).eq('user_id', userId)
          if (error) throw error
        }
      } catch (error) {
        throw toCommunityError(error)
      }
    },
  }
}
