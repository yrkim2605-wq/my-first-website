// 화면 시험용 "가짜 Supabase 서버"예요. 진짜 서버에는 연결하지 않고, 브라우저 안(sessionStorage)에서 흉내만 내요.
// 진짜 Supabase에 가짜 계정을 만들지 않고도 계정 모드 화면(리뷰 작성 · EXP · 하루 상한 · 오류 안내)을 눈으로 확인하려는 용도예요.
// 서버 규칙(하루 상한 등)은 SQL과 같은 알고리즘으로 흉내 내지만, 진짜 규칙 검증은 supabase/tests/rls.test.mjs · exp-parity.test.mjs가 해요.
//
// 켜는 법: npx vite --config supabase/tests/ui-fake/vite.fake.config.js --port 5195
// 조작(브라우저 콘솔): window.__fake.fail('create', '메시지')  → 다음 저장을 서버 오류로 만들기 / window.__fake.reset()

const DB_KEY = 'fake-supabase-db'
// 시험용 사진 (경로가 demo/로 시작하는 글에 이 그림이 나와요)
const DEMO_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#e8c58a"/><circle cx="400" cy="300" r="170" fill="#b9733a"/><text x="400" y="320" font-size="60" text-anchor="middle" fill="#fff">DEMO</text></svg>')
const KST_DAY = (iso) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
const ME = { id: 'u-ui', email: 'ui@test.dev', email_confirmed_at: '2026-10-14T00:00:00Z' }

const initial = () => ({
  profiles: [
    { id: 'u-ui', nickname: '테스트모험가', created_at: '2026-10-14T00:00:00Z' },
    { id: 'u-other', nickname: '다른모험가', created_at: '2026-10-14T00:00:00Z' },
  ],
  bakeries: [],
  reviews: [],
  visits: [],
  settings: { daily_exp_cap: 100, review_exp: 30, photo_exp: 10 },
  signedIn: true,
})

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DB_KEY)) ?? initial()
  } catch {
    return initial()
  }
}
const save = (db) => sessionStorage.setItem(DB_KEY, JSON.stringify(db))

const failures = {}
if (typeof window !== 'undefined') {
  window.__fake = {
    fail: (op, message = '서버 오류(시험용)') => (failures[op] = message),
    reset: () => {
      sessionStorage.removeItem(DB_KEY)
      location.reload()
    },
    db: () => load(),
    // 다른 사용자의 리뷰를 서버에 넣어 두기 (공개 목록 · 작성자 레벨 확인용)
    // 커뮤니티: 다른 모험가의 글 · 댓글을 서버에 넣어 두기 → 글 id를 돌려줘요
    seedPost: (title = '다른 모험가의 글', categoryId = 'recommend', content = '다른 모험가가 쓴 본문이에요.\n두 번째 줄이에요.') => {
      const db = load()
      ensureCommunity(db)
      const now = new Date().toISOString()
      const id = newId('post')
      db.posts.push({ id, user_id: 'u-other', category_id: categoryId, title, content, created_at: now, updated_at: now })
      save(db)
      return id
    },
    seedComment: (postId, content = '다른 모험가의 댓글', parentId = null) => {
      const db = load()
      ensureCommunity(db)
      const id = newId('c')
      db.comments.push({ id, post_id: postId, user_id: 'u-other', parent_id: parentId, content, created_at: new Date().toISOString() })
      save(db)
      return id
    },
    // 글 n개를 한 번에 넣기 (더 보기 시험용). withPhoto: 3개마다 사진 글
    seedMany: (n = 25, withPhoto = true) => {
      const db = load()
      ensureCommunity(db)
      const base = Date.now()
      for (let i = 0; i < n; i += 1) {
        const at = new Date(base - i * 3600 * 1000).toISOString()
        db.posts.push({ id: newId('post'), user_id: i % 4 === 0 ? ME.id : 'u-other', category_id: CATEGORY_IDS[i % 5], title: `시험 글 ${i + 1}`, content: `시험용 본문 ${i + 1}번이에요. 오늘 다녀온 빵집 이야기를 길게 적어 봤어요.`, created_at: at, updated_at: at, photo_path: withPhoto && i % 3 === 0 ? 'demo/p.jpg' : null })
      }
      save(db)
      return n
    },
    setSignedIn: (value) => {
      const db = load()
      db.signedIn = Boolean(value)
      save(db)
      location.reload()
    },
    seedOther: (bakeryId, content = '다른 모험가의 후기') => {
      const db = load()
      if (!db.bakeries.some((b) => b.id === bakeryId)) db.bakeries.push({ id: bakeryId, name: `빵집${bakeryId}`, district_id: 'seomyeon' })
      db.reviews.push({ id: `o-${bakeryId}`, user_id: 'u-other', bakery_id: bakeryId, rating: 5, content, photo_path: null, exp_review: true, exp_photo: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      save(db)
    },
  }
}

const withEmbeds = (db, review) => ({
  ...review,
  profiles: { nickname: db.profiles.find((p) => p.id === review.user_id)?.nickname ?? '' },
  bakeries: db.bakeries.find((b) => b.id === review.bakery_id) ?? null,
})

const progressOf = (db, userId) => {
  const mine = db.reviews.filter((r) => r.user_id === userId)
  const counted = mine.filter((r) => r.exp_review)
  const districts = new Set(counted.map((r) => db.bakeries.find((b) => b.id === r.bakery_id)?.district_id))
  const photos = counted.filter((r) => r.exp_photo && r.photo_path).length
  const exp =
    counted.length * db.settings.review_exp + photos * db.settings.photo_exp + (counted.length >= 1 ? 20 : 0) +
    (new Set(counted.map((r) => r.bakery_id)).size >= 3 ? 30 : 0) + (districts.size >= 3 ? 50 : 0)
  const level_index = exp >= 800 ? 4 : exp >= 400 ? 3 : exp >= 180 ? 2 : exp >= 60 ? 1 : 0
  return { user_id: userId, level_index, review_count: mine.length }
}

const dbError = (message, code) => Object.assign(new Error(message), { code })

// ── 커뮤니티: 서버 트리거 · RLS와 같은 규칙을 흉내 내요 (작성자 고정 · 하루 상한 글 10/댓글 50/좋아요 200 · 삭제 연쇄) ──
const CATEGORY_IDS = ['today-visit', 'new-menu', 'open-run', 'recommend', 'photo']
const ensureCommunity = (db) => {
  db.posts ??= []
  db.comments ??= []
  db.likes ??= []
}
const nick = (db, id) => db.profiles.find((p) => p.id === id)?.nickname ?? '알 수 없음'
const postFeedRow = (db, post) => ({
  id: post.id, category_id: post.category_id, title: post.title, content: post.content, photo_path: post.photo_path ?? null,
  created_at: post.created_at, updated_at: post.updated_at, user_id: post.user_id,
  author_nickname: nick(db, post.user_id), author_level_index: progressOf(db, post.user_id).level_index,
  like_count: db.likes.filter((l) => l.post_id === post.id).length,
  comment_count: db.comments.filter((c) => c.post_id === post.id).length,
  liked_by_me: Boolean(db.signedIn) && db.likes.some((l) => l.post_id === post.id && l.user_id === ME.id),
})
const todayCount = (rows) => rows.filter((r) => r.user_id === ME.id && KST_DAY(r.created_at) === KST_DAY(new Date())).length
const consumeFailure = (key) => {
  if (!failures[key]) return null
  const message = failures[key]
  delete failures[key]
  return dbError(message, 'XX000')
}
const newId = (prefix) => prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000)

const runCommunity = (db, q) => {
  ensureCommunity(db)
  const table = q.table
  const signedIn = Boolean(db.signedIn)
  const needLogin = () => (signedIn ? null : { data: null, error: dbError('NOT_SIGNED_IN', '28000') })

  if (q.op === 'select') {
    if (table === 'post_feed') {
      let rows = db.posts.map((post) => postFeedRow(db, post))
      if (q.filters.category_id) rows = rows.filter((r) => r.category_id === q.filters.category_id)
      if (q.filters.id) rows = rows.filter((r) => r.id === q.filters.id)
      for (const [column, dir] of [...q.orders].reverse()) {
        rows.sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) * (dir === 'desc' ? -1 : 1))
      }
      const total = rows.length
      if (q.range) rows = rows.slice(q.range[0], q.range[1] + 1)
      return q.single ? { data: rows[0] ?? null, error: null } : { data: rows, error: null, count: q.count === 'exact' ? total : undefined }
    }
    if (table === 'posts') {
      // 글 고치기 전에 현재 사진 경로를 읽는 요청
      const row = db.posts.find((p) => p.id === q.filters.id && p.user_id === q.filters.user_id)
      return { data: row ? { photo_path: row.photo_path ?? null } : null, error: null }
    }
    if (table === 'comment_feed') {
      const rows = db.comments
        .filter((c) => c.post_id === q.filters.post_id)
        .map((c) => ({ ...c, author_nickname: nick(db, c.user_id), author_level_index: progressOf(db, c.user_id).level_index, is_mine: signedIn && c.user_id === ME.id }))
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      return { data: rows, error: null }
    }
    return { data: [], error: null }
  }

  const loginError = needLogin()
  if (loginError) return loginError

  if (table === 'posts') {
    if (q.op === 'insert') {
      const failed = consumeFailure('post')
      if (failed) return { data: null, error: failed }
      const { category_id, title, content, photo_path } = q.payload
      if (!CATEGORY_IDS.includes(category_id) || !String(title).trim() || String(title).length > 80 || !String(content).trim() || String(content).length > 2000) {
        return { data: null, error: dbError('check', '23514') }
      }
      if (todayCount(db.posts) >= 10) return { data: null, error: dbError('DAILY_LIMIT', 'P0001') }
      const now = new Date().toISOString()
      const row = { id: newId('post'), user_id: ME.id, category_id, title: String(title).trim(), content: String(content).trim(), created_at: now, updated_at: now, photo_path: photo_path ?? null }
      db.posts.push(row)
      save(db)
      return { data: { id: row.id }, error: null }
    }
    if (q.op === 'update') {
      const failed = consumeFailure('postUpdate')
      if (failed) return { data: null, error: failed }
      const row = db.posts.find((r) => r.id === q.filters.id && r.user_id === q.filters.user_id && q.filters.user_id === ME.id)
      if (!row) return { data: [], error: null }
      Object.assign(row, q.payload, { updated_at: new Date().toISOString() })
      save(db)
      return { data: [{ id: row.id }], error: null }
    }
    if (q.op === 'delete') {
      const failed = consumeFailure('postDelete')
      if (failed) return { data: null, error: failed }
      const gone = db.posts.filter((r) => r.id === q.filters.id && r.user_id === q.filters.user_id && q.filters.user_id === ME.id)
      db.posts = db.posts.filter((r) => !gone.includes(r))
      const goneIds = gone.map((r) => r.id)
      db.comments = db.comments.filter((c) => !goneIds.includes(c.post_id))
      db.likes = db.likes.filter((l) => !goneIds.includes(l.post_id))
      save(db)
      return { data: gone.map((r) => ({ id: r.id, photo_path: r.photo_path ?? null })), error: null }
    }
  }

  if (table === 'comments') {
    if (q.op === 'insert') {
      const failed = consumeFailure('comment')
      if (failed) return { data: null, error: failed }
      const { post_id, parent_id, content } = q.payload
      if (!db.posts.some((p) => p.id === post_id)) return { data: null, error: dbError('fk', '23503') }
      if (!String(content).trim() || String(content).length > 500) return { data: null, error: dbError('check', '23514') }
      if (parent_id) {
        const parent = db.comments.find((c) => c.id === parent_id)
        if (!parent || parent.post_id !== post_id || parent.parent_id) return { data: null, error: dbError('INVALID_PARENT', '23514') }
      }
      if (todayCount(db.comments) >= 50) return { data: null, error: dbError('DAILY_LIMIT', 'P0001') }
      db.comments.push({ id: newId('c'), post_id, user_id: ME.id, parent_id: parent_id ?? null, content: String(content).trim(), created_at: new Date().toISOString() })
      save(db)
      return { data: null, error: null }
    }
    if (q.op === 'delete') {
      const gone = db.comments.filter((c) => c.id === q.filters.id && c.user_id === q.filters.user_id && q.filters.user_id === ME.id)
      const goneIds = gone.map((c) => c.id)
      db.comments = db.comments.filter((c) => !goneIds.includes(c.id) && !goneIds.includes(c.parent_id))
      save(db)
      return { data: null, error: null }
    }
  }

  if (table === 'post_likes') {
    if (q.op === 'insert') {
      const failed = consumeFailure('like')
      if (failed) return { data: null, error: failed }
      if (!db.posts.some((p) => p.id === q.payload.post_id)) return { data: null, error: dbError('fk', '23503') }
      if (db.likes.some((l) => l.post_id === q.payload.post_id && l.user_id === ME.id)) return { data: null, error: dbError('dup', '23505') }
      db.likes.push({ post_id: q.payload.post_id, user_id: ME.id })
      save(db)
      return { data: null, error: null }
    }
    if (q.op === 'delete') {
      db.likes = db.likes.filter((l) => !(l.post_id === q.filters.post_id && l.user_id === q.filters.user_id))
      save(db)
      return { data: null, error: null }
    }
  }
  return { data: null, error: null }
}

// 서버 트리거(reviews_before_insert)와 같은 계산
const insertReview = (db, payload) => {
  if (failures.create) {
    const message = failures.create
    delete failures.create
    return { error: dbError(message, 'XX000') }
  }
  if (!db.bakeries.some((b) => b.id === payload.bakery_id)) return { error: dbError('fk', '23503') }
  if (db.reviews.some((r) => r.user_id === ME.id && r.bakery_id === payload.bakery_id)) return { error: dbError('duplicate', '23505') }
  const today = KST_DAY(new Date())
  const todays = db.reviews.filter((r) => r.user_id === ME.id && KST_DAY(r.created_at) === today)
  if (todays.length >= 20) return { error: dbError('DAILY_REVIEW_LIMIT') }
  const { review_exp, photo_exp, daily_exp_cap } = db.settings
  const used = todays.filter((r) => r.exp_review).length * review_exp + todays.filter((r) => r.exp_photo && r.photo_path).length * photo_exp
  const left = Math.max(daily_exp_cap - used, 0)
  const exp_review = left >= review_exp
  const row = {
    id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: ME.id,
    bakery_id: payload.bakery_id,
    rating: payload.rating,
    content: payload.content,
    photo_path: payload.photo_path ?? null,
    exp_review,
    exp_photo: exp_review && Boolean(payload.photo_path) && left >= review_exp + photo_exp,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.reviews.push(row)
  return { row }
}

export const createClient = () => {
  const makeBuilder = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null, single: false, returning: false, orders: [], range: null, count: null }
    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 150)) // 네트워크 지연 흉내
      const db = load()
      if (table === 'profiles') {
        const found = db.profiles.find((p) => p.id === q.filters.id) ?? null
        return { data: found, error: null }
      }
      // 로컬 기록 가져오기 미리보기: 서버에 이미 있는 빵집 id 목록 (.in)
      if (table === 'bakeries' && q.inFilter) return { data: db.bakeries.filter((b) => q.inFilter.values.includes(b[q.inFilter.key])), error: null }
      if (table === 'bakeries') return { data: db.bakeries.find((b) => b.id === q.filters.id) ?? null, error: null }
      if (table === 'game_settings') return { data: Object.entries(db.settings).map(([key, value]) => ({ key, value })), error: null }
      if (table === 'user_progress') return { data: db.profiles.map((p) => progressOf(db, p.id)).filter((p) => p.review_count > 0), error: null }
      if (table === 'bakery_visits') {
        db.visits ??= []
        if (q.op === 'insert') {
          if (failures.visit) {
            const message = failures.visit
            delete failures.visit
            return { data: null, error: dbError(message, 'XX000') }
          }
          if (!db.bakeries.some((b) => b.id === q.payload.bakery_id)) return { data: null, error: dbError('fk', '23503') }
          if (db.visits.some((v) => v.user_id === ME.id && v.bakery_id === q.payload.bakery_id)) return { data: null, error: dbError('dup', '23505') }
          db.visits.push({ user_id: ME.id, bakery_id: q.payload.bakery_id, created_at: new Date().toISOString() })
          save(db)
          return { data: null, error: null }
        }
        if (q.op === 'delete') {
          db.visits = db.visits.filter((v) => !(v.bakery_id === q.filters.bakery_id && v.user_id === q.filters.user_id))
          save(db)
          return { data: null, error: null }
        }
        const rows = db.visits
          .filter((v) => v.user_id === q.filters.user_id)
          .map((v) => ({ ...v, bakeries: db.bakeries.find((b) => b.id === v.bakery_id) ?? null }))
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        return { data: rows, error: null }
      }
      if (['post_feed', 'comment_feed', 'posts', 'comments', 'post_likes'].includes(table)) return runCommunity(db, q)
      if (table !== 'reviews') return { data: [], error: null }

      if (q.op === 'insert') {
        const { row, error } = insertReview(db, q.payload)
        if (error) return { data: null, error }
        save(db)
        return { data: withEmbeds(db, row), error: null }
      }
      if (q.op === 'update') {
        const row = db.reviews.find((r) => r.id === q.filters.id && r.user_id === q.filters.user_id)
        if (!row) return { data: null, error: dbError('not found', 'PGRST116') }
        if (failures.update) {
          const message = failures.update
          delete failures.update
          return { data: null, error: dbError(message, 'XX000') }
        }
        Object.assign(row, q.payload, { updated_at: new Date().toISOString() }) // exp_* 칸은 바뀌지 않아요
        save(db)
        return { data: withEmbeds(db, row), error: null }
      }
      if (q.op === 'delete') {
        const gone = db.reviews.filter((r) => r.id === q.filters.id && r.user_id === q.filters.user_id)
        db.reviews = db.reviews.filter((r) => !gone.includes(r))
        save(db)
        return { data: gone.map((r) => ({ id: r.id, photo_path: r.photo_path })), error: null }
      }
      let rows = db.reviews.map((r) => withEmbeds(db, r))
      if (q.filters.user_id) rows = rows.filter((r) => r.user_id === q.filters.user_id)
      if (q.filters.id) rows = rows.filter((r) => r.id === q.filters.id)
      rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      return q.single ? { data: rows[0] ?? null, error: null } : { data: rows, error: null }
    }
    const builder = {
      select: (columns, opts) => ((q.count = opts?.count ?? null), builder),
      range: (from, to) => ((q.range = [from, to]), builder),
      in: (key, values) => ((q.inFilter = { key, values }), builder),
      eq: (key, value) => ((q.filters[key] = value), builder),
      gt: () => builder,
      order: (column, opts) => (q.orders.push([column, opts?.ascending === false ? 'desc' : 'asc']), builder),
      limit: () => builder,
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      update: (payload) => ((q.op = 'update'), (q.payload = payload), builder),
      delete: () => ((q.op = 'delete'), builder),
      maybeSingle: () => ((q.single = true), run()),
      single: () => ((q.single = true), run()),
      then: (resolve, reject) => run().then(resolve, reject),
    }
    return builder
  }

  const listeners = new Set()
  return {
    from: makeBuilder,
    rpc: async () => ({ data: true, error: null }),
    auth: {
      getSession: async () => ({ data: { session: load().signedIn ? { user: ME } : null }, error: null }),
      initialize: async () => ({ error: null }),
      signOut: async () => {
        const db = load()
        db.signedIn = false
        save(db)
        listeners.forEach((listener) => listener('SIGNED_OUT'))
        return { error: null }
      },
      onAuthStateChange: (callback) => {
        listeners.add(callback)
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
      },
    },
    storage: {
      from: () => ({
        getPublicUrl: (path) => ({ data: { publicUrl: (String(path).startsWith('demo/') || String(path).startsWith('u-ui/')) ? DEMO_PHOTO : `https://fake-storage.test/photos/${path}` } }),
        upload: async (path) => {
          // fail('upload')는 한 번만 실패해요 (다른 시험 도구와 같은 방식)
          const failed = failures.upload
          delete failures.upload
          return { data: { path }, error: failed ? dbError(failed) : null }
        },
        remove: async (paths) => ({ data: paths.map((name) => ({ name })), error: null }),
      }),
    },
    functions: {
      invoke: async (name, { body }) => {
        await new Promise((resolve) => setTimeout(resolve, 150))
        const db = load()
        if (failures.register) {
          const status = failures.register
          delete failures.register
          return { data: null, error: Object.assign(new Error('fn'), { context: { status, json: async () => ({ error: { code: 'BAKERY_NOT_FOUND', message: '실제 제과 · 베이커리로 확인되지 않았어요. (시험용)' } }) } }) }
        }
        if (!db.bakeries.some((b) => b.id === body.id)) db.bakeries.push({ id: body.id, name: body.name, district_id: body.districtId ?? 'seomyeon' })
        save(db)
        return { data: { ok: true }, error: null }
      },
    },
  }
}
