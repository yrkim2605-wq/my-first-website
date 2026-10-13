import { useMemo } from 'react'
import { useBusanBakeries } from './useBusanBakeries'
import { useGameState } from './useGameState'

// 빵집 도감: "내가 모험 일지를 남긴 카카오 빵집 = 발견 완료"예요.
// 전체 수(totalCount)는 지금 불러온 카카오 빵집 수라서, 카카오 검색 결과가 바뀌면 달라질 수 있어요.
// 일지를 남긴 빵집이 지금 목록에 없어도 발견은 유지돼요 (extraDiscovered에 따로 담아요).
export const useDiscovery = () => {
  const { bakeries, loading, error, reload } = useBusanBakeries()
  const game = useGameState()
  const discoveredIds = game.stats.discoveredBakeryIds

  return useMemo(() => {
    const listIds = new Set(bakeries.map((bakery) => String(bakery.id)))
    const discoveredInList = bakeries.filter((bakery) => discoveredIds.has(String(bakery.id)))
    // 목록에 없는 발견: 일지에 저장해 둔 빵집 이름으로 보여줘요
    const extraDiscovered = game.myReviews
      .filter((review) => review.bakerySource === 'kakao' && !listIds.has(review.bakeryId))
      .map((review) => ({ id: review.bakeryId, name: review.bakeryName, districtId: review.districtId }))

    return {
      bakeries,
      loading,
      error,
      reload,
      discoveredIds,
      isDiscovered: (id) => discoveredIds.has(String(id)),
      discoveredCount: discoveredIds.size,
      discoveredInListCount: discoveredInList.length,
      totalCount: bakeries.length,
      extraDiscovered,
    }
  }, [bakeries, loading, error, reload, discoveredIds, game.myReviews])
}
