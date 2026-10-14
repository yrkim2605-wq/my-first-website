import { IS_ACCOUNT_MODE } from '../lib/backend'
import { getSupabase } from '../lib/supabaseClient'
import { createSupabaseRankingRepository } from './supabaseRankingRepository'

// 실제 랭킹 저장소예요. 계정 모드(VITE_DATA_BACKEND=supabase)에서만 있고, 로컬 모드에서는 null이에요.
// 로컬 모드의 명예의 전당은 이 브라우저 안의 기록 순위와 '예시' 순위표를 보여줘요.
export const rankingRepository = IS_ACCOUNT_MODE ? createSupabaseRankingRepository(getSupabase) : null
