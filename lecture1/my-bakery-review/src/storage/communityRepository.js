import { IS_ACCOUNT_MODE } from '../lib/backend'
import { getSupabase } from '../lib/supabaseClient'
import { createSupabaseCommunityRepository } from './supabaseCommunityRepository'

// 커뮤니티 저장소예요. 계정 모드(VITE_DATA_BACKEND=supabase)에서만 있고, 로컬 모드에서는 null이에요.
// 로컬 모드의 커뮤니티는 코드에 들어 있는 예시 글(constants/communityPosts.js)을 보여주기만 해요.
export const communityRepository = IS_ACCOUNT_MODE ? createSupabaseCommunityRepository(getSupabase) : null
