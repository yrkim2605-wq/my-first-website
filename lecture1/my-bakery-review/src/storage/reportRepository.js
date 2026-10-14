import { IS_ACCOUNT_MODE } from '../lib/backend'
import { getSupabase } from '../lib/supabaseClient'
import { createSupabaseReportRepository } from './supabaseReportRepository'

// 신고 저장소예요. 계정 모드(VITE_DATA_BACKEND=supabase)에서만 있고, 로컬 모드에서는 null이에요.
// (로컬 모드의 글은 예시 데이터라서 신고할 대상이 없어요.)
export const reportRepository = IS_ACCOUNT_MODE ? createSupabaseReportRepository(getSupabase) : null
