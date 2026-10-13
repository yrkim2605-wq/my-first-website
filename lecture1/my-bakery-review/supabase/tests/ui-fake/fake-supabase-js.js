// 화면 시험용 "가짜 Supabase 서버"예요. 진짜 서버에는 연결하지 않고, 브라우저 안(sessionStorage)에서 흉내만 내요.
// 진짜 Supabase에 가짜 계정을 만들지 않고도 계정 모드 화면(리뷰 작성 · EXP · 하루 상한 · 오류 안내)을 눈으로 확인하려는 용도예요.
// 서버 규칙(하루 상한 등)은 SQL과 같은 알고리즘으로 흉내 내지만, 진짜 규칙 검증은 supabase/tests/rls.test.mjs · exp-parity.test.mjs가 해요.
//
// 켜는 법: npx vite --config supabase/tests/ui-fake/vite.fake.config.js --port 5195
// 조작(브라우저 콘솔): window.__fake.fail('create', '메시지')  → 다음 저장을 서버 오류로 만들기 / window.__fake.reset()

const DB_KEY = 'fake-supabase-db'
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
    const q = { table, op: 'select', filters: {}, payload: null, single: false, returning: false }
    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 150)) // 네트워크 지연 흉내
      const db = load()
      if (table === 'profiles') {
        const found = db.profiles.find((p) => p.id === q.filters.id) ?? null
        return { data: found, error: null }
      }
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
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      gt: () => builder,
      order: () => builder,
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
        getPublicUrl: (path) => ({ data: { publicUrl: `https://fake-storage.test/photos/${path}` } }),
        upload: async (path) => ({ data: { path }, error: failures.upload ? dbError(failures.upload) : null }),
        remove: async () => ({ data: [], error: null }),
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
