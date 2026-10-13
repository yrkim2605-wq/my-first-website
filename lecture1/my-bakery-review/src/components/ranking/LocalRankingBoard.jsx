import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import RankingListItem from '../common/RankingListItem'
import StatusMessage from '../common/StatusMessage'
import { useProfile } from '../../hooks/useProfile'
import { useReviews } from '../../hooks/useReviews'
import { profileRepository } from '../../storage/profileRepository'
import { IS_ACCOUNT_MODE } from '../../lib/backend'
import { buildLocalRanking } from '../../utils/localRanking'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT } from '../../theme'

// 명예의 전당의 "실제 기록" 순위: 이 브라우저에 저장된 모험가들의 일지로 계산해요.
// 다른 기기 · 다른 사람의 기록은 들어 있지 않아요 (서버가 없어서).
const LocalRankingBoard = () => {
  const { profile } = useProfile()
  const { reviews } = useReviews()
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    if (IS_ACCOUNT_MODE) return undefined // 계정 모드: 로컬 프로필 목록을 쓰지 않아요
    const load = () => profileRepository.list().then(setProfiles)
    load()
    return profileRepository.subscribe(load)
  }, [])

  // 방금 만든 프로필도 바로 반영되도록 현재 프로필을 함께 넣어요 (중복은 userId로 걸러요)
  const ranking = useMemo(() => {
    const all = profile && !profiles.some((item) => item.userId === profile.userId) ? [...profiles, profile] : profiles
    return buildLocalRanking(all, reviews)
  }, [profiles, profile, reviews])

  return (
    <Box component="section" aria-label="실제 기록 순위" sx={{ mb: { xs: 4, sm: 6 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
        <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: 'primary.main' }}>
          이 브라우저의 모험가 순위
        </Typography>
        <Box component="span" sx={{ px: 1, py: 0.1, borderRadius: 999, bgcolor: 'wood.main', color: 'gold.light', fontSize: '0.75rem', fontWeight: 800 }}>
          실제 기록
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1.5, wordBreak: 'keep-all' }}>
        이 브라우저에 저장된 모험 일지로 계산한 EXP 순위예요. 일지를 남긴 모험가만 올라와요.
      </Typography>

      {ranking.length === 0 ? (
        <StatusMessage
          title="아직 순위에 오른 모험가가 없어요"
          description="모험 일지를 하나라도 남기면 EXP가 쌓이고 이 순위에 이름이 올라가요."
        />
      ) : (
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, ...PARCHMENT_SX, borderRadius: '18px', overflow: 'hidden' }}>
          {ranking.map((entry) => (
            <RankingListItem
              key={entry.userId}
              rank={entry.rank}
              avatarImage={entry.level.iconImage}
              avatarScale={entry.level.iconScale}
              primaryText={entry.userId === profile?.userId ? `${entry.nickname} (나)` : entry.nickname}
              levelBadge={`Lv.${entry.levelIndex + 1} ${entry.level.name}`}
              secondaryText={`일지 ${entry.reviewCount}개 · 발견한 빵집 ${entry.discoveredCount}곳`}
              valueText={entry.exp}
              valueKind="exp"
            />
          ))}
        </Box>
      )}
      {ranking.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
          <Typography component={Link} to="/" sx={{ fontWeight: 800, color: 'primary.main', py: 1.25, px: 2 }}>
            빵집 찾으러 가기
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default LocalRankingBoard
