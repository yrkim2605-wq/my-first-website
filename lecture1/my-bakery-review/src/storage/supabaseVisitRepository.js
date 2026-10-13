import { RepositoryError } from './localStore'
import { ensureBakeryRegistered, messages, toReviewError } from './supabaseShared'

// "다녀왔어요" 체크 저장소 — Supabase 버전이에요 (bakery_visits 표).
//  - 사용자가 직접 남기는 "나만 보는 체크"예요. 방문을 인증하지 않고, EXP · 도감 · 퀘스트에 반영되지 않아요.
//  - 내 체크만 읽고 쓰고 지울 수 있어요 (서버 권한으로 보장돼요). 다른 기기에서 로그인해도 이어져요.
//  - 연결에 실패하면 로컬에 대신 저장하지 않고 오류를 던져요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)

export const createSupabaseVisitRepository = (getClient) => {
  const requireUserId = async (client) => {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    const userId = data.session?.user?.id
    if (!userId) throw new RepositoryError('NOT_SIGNED_IN', messages.NOT_SIGNED_IN)
    return userId
  }

  return {
    // 내가 체크한 빵집들 (최신순): [{ bakeryId, name, districtId, address, createdAt }]
    async list() {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { data, error } = await client
          .from('bakery_visits')
          .select('bakery_id, created_at, bakeries(name, district_id, address)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1000)
        if (error) throw error
        return (data ?? []).map((row) => ({
          bakeryId: row.bakery_id,
          name: row.bakeries?.name ?? '',
          districtId: row.bakeries?.district_id ?? null,
          address: row.bakeries?.address ?? '',
          createdAt: row.created_at,
        }))
      } catch (error) {
        // 로그인하지 않았으면 빈 목록이에요 (오류가 아니에요)
        if (error instanceof RepositoryError && error.code === 'NOT_SIGNED_IN') return []
        throw toReviewError(error)
      }
    },

    // 체크하기. 처음 보는 빵집은 서버가 카카오로 확인해서 등록한 뒤에 체크해요. 이미 체크했으면 그대로 성공이에요.
    async add(bakery) {
      try {
        const client = await getClient()
        await requireUserId(client)
        await ensureBakeryRegistered(client, {
          bakeryId: String(bakery.id),
          bakeryName: bakery.name,
          districtId: bakery.districtId,
          bakeryLat: bakery.lat,
          bakeryLng: bakery.lng,
          bakeryAddress: bakery.address,
        })
        // 작성자 · 날짜는 서버가 정해요. 빵집 ID만 보내요.
        const { error } = await client.from('bakery_visits').insert({ bakery_id: String(bakery.id) })
        if (error && error.code !== '23505') throw error // 23505 = 이미 체크함
      } catch (error) {
        throw toReviewError(error)
      }
    },

    // 체크 취소 (내 체크만). 이미 없어도 성공이에요.
    async remove(bakeryId) {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { error } = await client.from('bakery_visits').delete().eq('bakery_id', String(bakeryId)).eq('user_id', userId)
        if (error) throw error
      } catch (error) {
        throw toReviewError(error)
      }
    },
  }
}
