import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ProfileContext, VisitedBakeriesContext } from './contexts'
import { createSupabaseVisitRepository } from '../storage/supabaseVisitRepository'
import { RepositoryError } from '../storage/localStore'
import { IS_ACCOUNT_MODE, getBackendConfigProblem } from '../lib/backend'
import { getSupabase } from '../lib/supabaseClient'

// "다녀왔어요" 체크 목록이에요. 나만 보는 체크이고, 방문을 인증하지 않으며 EXP · 도감 · 퀘스트에는 반영되지 않아요.
//  - 로컬 모드: 이 브라우저(localStorage)에 저장 (이전과 똑같아요. 기존 기록은 그대로 읽어요)
//  - 계정 모드: 내 계정(Supabase)에 저장 → 다른 기기에서 로그인해도 유지돼요.
//    서버에 저장이 성공한 뒤에만 체크 표시가 바뀌고, 실패하면 이유를 알려요 (로컬에 몰래 저장하지 않아요).

const STORAGE_KEY = 'my-bakery-review:visited-real-bakery-ids'
const visitRepository = IS_ACCOUNT_MODE ? createSupabaseVisitRepository(getSupabase) : null

const loadLocalIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const VisitedBakeriesProvider = ({ children }) => {
  const profileCtx = useContext(ProfileContext)
  const userId = profileCtx?.profile?.userId ?? null

  // 로컬 모드 상태 (계정 모드에서는 읽지도 쓰지도 않아요)
  const [localIds, setLocalIds] = useState(() => (IS_ACCOUNT_MODE ? [] : loadLocalIds()))
  useEffect(() => {
    if (IS_ACCOUNT_MODE) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localIds))
  }, [localIds])

  // 계정 모드 상태
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(IS_ACCOUNT_MODE)
  const [loadError, setLoadError] = useState(null)
  const [pendingIds, setPendingIds] = useState([])

  const reload = useCallback(() => {
    if (!IS_ACCOUNT_MODE) return Promise.resolve()
    if (getBackendConfigProblem()) return Promise.resolve().then(() => setLoading(false))
    return visitRepository
      .list()
      .then((items) => {
        setVisits(items)
        setLoadError(null)
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [])

  // 로그인 · 로그아웃이 바뀌면 내 체크 목록을 다시 불러와요
  useEffect(() => {
    if (!IS_ACCOUNT_MODE) return
    reload()
  }, [reload, userId])

  const visitedIds = useMemo(() => (IS_ACCOUNT_MODE ? visits.map((visit) => visit.bakeryId) : localIds), [visits, localIds])

  // 체크 / 취소. 계정 모드에서는 빵집 정보(이름 · 좌표 등)가 필요해서 빵집 객체를 받아요 (로컬 모드는 ID만 있어도 돼요).
  // 저장에 성공하면 resolve, 실패하면 오류를 던져요 (화면이 안내를 보여줘요).
  const toggleVisited = useCallback(
    async (bakeryOrId) => {
      const bakery = typeof bakeryOrId === 'object' ? bakeryOrId : { id: bakeryOrId }
      if (!IS_ACCOUNT_MODE) {
        setLocalIds((prev) => (prev.includes(bakery.id) ? prev.filter((id) => id !== bakery.id) : [...prev, bakery.id]))
        return
      }
      if (!userId) throw new RepositoryError('NOT_SIGNED_IN', '로그인하면 방문 체크를 남길 수 있어요.')
      if (pendingIds.includes(bakery.id)) return // 저장 중에 또 누르면 무시해요
      setPendingIds((prev) => [...prev, bakery.id])
      try {
        if (visitedIds.includes(bakery.id)) await visitRepository.remove(bakery.id)
        else await visitRepository.add(bakery)
        await reload()
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== bakery.id))
      }
    },
    [userId, pendingIds, visitedIds, reload],
  )

  const value = useMemo(
    () => ({ visitedIds, visits, toggleVisited, pendingIds, loading, loadError, isAccountMode: IS_ACCOUNT_MODE }),
    [visitedIds, visits, toggleVisited, pendingIds, loading, loadError],
  )

  return <VisitedBakeriesContext.Provider value={value}>{children}</VisitedBakeriesContext.Provider>
}
