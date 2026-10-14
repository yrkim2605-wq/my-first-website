import { getSupabase } from '../lib/supabaseClient'
import { createSupabaseReviewRepository } from '../storage/supabaseReviewRepository'
import { createSupabaseVisitRepository } from '../storage/supabaseVisitRepository'
import { toReviewError } from '../storage/supabaseShared'
import { recordImportState } from './localImport'

// 로컬 기록 이전에 쓰는 서버 연결이에요.
//  - loadAccountSnapshot: 미리보기에 필요한 "내 계정의 현재 기록"을 읽기만 해요 (서버에 아무것도 쓰지 않아요).
//  - createImportDeps    : 최종 확인 뒤에만 쓰는 저장 도구예요. 새로 저장하는 기능(create · add)과 이전 상태 기록만 있고,
//                          수정 · 삭제는 아예 넣지 않아서 기존 계정 기록을 덮어쓸 수 없어요.

export const loadAccountSnapshot = async (accountUserId, bakeryIds) => {
  try {
    const reviewRepository = createSupabaseReviewRepository(getSupabase)
    const visitRepository = createSupabaseVisitRepository(getSupabase)
    const [reviews, visits] = await Promise.all([reviewRepository.list(), visitRepository.list()])
    const mine = reviews.filter((review) => review.userId === accountUserId)

    // 서버에 이미 등록된 빵집인지 (등록돼 있으면 위치 정보 없이도 일지 · 체크를 저장할 수 있어요)
    const registeredIds = new Set()
    const ids = [...new Set(bakeryIds.map(String))]
    if (ids.length > 0) {
      const client = await getSupabase()
      const { data, error } = await client.from('bakeries').select('id').in('id', ids)
      if (error) throw error
      for (const row of data ?? []) registeredIds.add(row.id)
    }
    return {
      accountReviews: mine,
      reviewBakeryIds: new Set(mine.map((review) => review.bakeryId)),
      visitBakeryIds: new Set(visits.map((visit) => visit.bakeryId)),
      registeredIds,
    }
  } catch (error) {
    throw toReviewError(error, 'read')
  }
}

export const createImportDeps = (accountUserId) => {
  const reviewRepository = createSupabaseReviewRepository(getSupabase)
  const visitRepository = createSupabaseVisitRepository(getSupabase)
  return {
    createReview: (input) => reviewRepository.create(input),
    addVisit: (bakery) => visitRepository.add(bakery),
    saveState: (key, status) => recordImportState(accountUserId, key, status),
  }
}
