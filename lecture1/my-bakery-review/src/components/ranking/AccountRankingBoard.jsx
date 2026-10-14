import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import RankingListItem from '../common/RankingListItem'
import RankingPodium from '../common/RankingPodium'
import StatusMessage from '../common/StatusMessage'
import { useProfile } from '../../hooks/useProfile'
import { rankingRepository } from '../../storage/rankingRepository'
import { getBackendConfigProblem } from '../../lib/backend'
import { COMMUNITY_CATEGORIES } from '../../constants/categories'
import { DISTRICTS } from '../../constants/districts'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { formatPostDate, levelFromIndex } from '../../utils/communityFormat'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 계정 모드의 명예의 전당: 서버에 저장된 모든 모험가의 실제 기록으로 계산한 순위예요 (예시 데이터는 섞이지 않아요).
// 순위 번호와 동점 순서는 서버가 정하고, 이 화면은 그대로 보여주기만 해요. 닉네임 · 레벨 · EXP · 일지/좋아요 수만 공개돼요.

const DESCRIPTIONS = {
  exp: '누적 EXP 순위예요. 동점이면 일지가 많은 순 → 먼저 가입한 순이에요.',
  monthly: '한국 시간 기준으로 이번 달에 남긴 모험 일지 수 순위예요. 동점이면 누적 EXP가 높은 순 → 먼저 가입한 순이에요.',
  bakeries: '모험 일지가 많이 남겨진 빵집이에요. 동점이면 평균 별점이 높은 순 → 이름순이에요.',
  posts: '커뮤니티에서 좋아요를 많이 받은 글이에요. 동점이면 댓글이 많은 순 → 먼저 쓴 글 순이에요.',
}

const EMPTY = {
  exp: { title: '아직 순위에 오른 모험가가 없어요', description: '모험 일지를 하나라도 남기면 EXP가 쌓이고 이 순위에 이름이 올라가요.', actionLabel: '빵집 찾으러 가기', to: '/' },
  monthly: { title: '이번 달에 남겨진 일지가 아직 없어요', description: '이번 달 첫 모험 일지의 주인공이 되어 보세요.', actionLabel: '빵집 찾으러 가기', to: '/' },
  bakeries: { title: '아직 일지가 남겨진 빵집이 없어요', description: '빵집에 모험 일지를 남기면 이 순위에 올라가요.', actionLabel: '빵집 찾으러 가기', to: '/' },
  posts: { title: '아직 좋아요를 받은 글이 없어요', description: '마음에 드는 글에 좋아요를 눌러 보세요.', actionLabel: '글 보러 가기', to: '/community' },
}

const districtName = (districtId) => DISTRICTS.find((district) => district.id === districtId)?.name

// 서버 한 줄 → 순위 컴포넌트가 받는 모양
const toItem = (boardId, entry, myUserId) => {
  if (boardId === 'exp' || boardId === 'monthly') {
    const level = levelFromIndex(entry.levelIndex)
    const isMine = Boolean(myUserId) && entry.userId === myUserId
    return {
      rank: entry.rank,
      avatarImage: level.iconImage,
      avatarScale: level.iconScale,
      primaryText: isMine ? `${entry.nickname} (나)` : entry.nickname,
      levelBadge: `Lv.${entry.levelIndex + 1} ${level.name}`,
      secondaryText: boardId === 'exp' ? `일지 ${entry.reviewCount}개 · 발견한 빵집 ${entry.discoveredCount}곳` : `누적 EXP ${entry.exp}`,
      valueText: boardId === 'exp' ? entry.exp : entry.monthReviewCount,
      valueKind: boardId === 'exp' ? 'exp' : 'review',
      isMine,
    }
  }
  if (boardId === 'bakeries') {
    return {
      rank: entry.rank,
      emoji: '🥖',
      primaryText: entry.name,
      secondaryText: [districtName(entry.districtId), entry.avgRating != null ? `평균 별점 ${entry.avgRating.toFixed(1)}` : null].filter(Boolean).join(' · '),
      valueText: entry.reviewCount,
      valueKind: 'review',
    }
  }
  const category = COMMUNITY_CATEGORIES.find((c) => c.id === entry.categoryId)
  return {
    rank: entry.rank,
    emoji: category?.emoji ?? '📝',
    primaryText: entry.title,
    secondaryText: `${entry.author} · 댓글 ${entry.commentCount}`,
    valueText: entry.likeCount,
    valueKind: 'heart',
    to: `/community/${entry.postId}`,
  }
}

// "내 순위" 카드: 상위 10위 밖이어도 전체 기준 내 순위를 보여줘요
const MyRankCard = ({ boardId, profile, ready, me }) => {
  const shell = { ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 2, mb: 3 }
  if (!ready) return null
  if (!profile) {
    return (
      <Box sx={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '0.9rem', wordBreak: 'keep-all' }}>
          <b>내 순위</b> · 로그인하면 내가 몇 위인지 볼 수 있어요.
        </Typography>
        <Button component={Link} to="/login" variant="contained" size="small">
          로그인
        </Button>
      </Box>
    )
  }
  if (!me) {
    return (
      <Box sx={shell}>
        <Typography sx={{ fontSize: '0.9rem', wordBreak: 'keep-all' }}>
          <b>내 순위</b> ·{' '}
          {boardId === 'monthly' ? '이번 달에 남긴 일지가 아직 없어서 순위에 없어요.' : '아직 순위에 없어요. EXP를 받는 모험 일지를 남기면 올라가요.'}
        </Typography>
      </Box>
    )
  }
  const level = levelFromIndex(me.levelIndex)
  return (
    <Box
      aria-label="내 순위"
      sx={{ ...shell, borderColor: 'gold.main', display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 } }}
    >
      <Box sx={{ width: 52, height: 52, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
        <Box component="img" src={level.iconImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>
          내 순위 <Box component="span" sx={{ color: 'primary.main' }}>{me.rank}위</Box>
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
          {profile.nickname} · {boardId === 'exp' ? `누적 EXP ${me.exp}` : `이번 달 일지 ${me.monthReviewCount}개`}
          {me.rank <= 10 ? ' · 상위 10위 안이에요!' : ''}
        </Typography>
      </Box>
    </Box>
  )
}

const AccountRankingBoard = ({ boardId, label }) => {
  const { profile, ready } = useProfile()
  const userId = profile?.userId ?? null
  const [retryCount, setRetryCount] = useState(0)
  const requestKey = `${boardId}|${userId}|${retryCount}`
  const [result, setResult] = useState({ key: null, items: [], me: null, errorMessage: null })

  useEffect(() => {
    let isCancelled = false
    const configProblem = getBackendConfigProblem()
    if (configProblem) {
      Promise.resolve().then(() => !isCancelled && setResult({ key: requestKey, items: [], me: null, errorMessage: configProblem }))
    } else {
      rankingRepository
        .getBoard(boardId)
        .then(({ items, me }) => !isCancelled && setResult({ key: requestKey, items, me, errorMessage: null }))
        .catch((error) => !isCancelled && setResult({ key: requestKey, items: [], me: null, errorMessage: error.message }))
    }
    return () => {
      isCancelled = true
    }
  }, [boardId, requestKey])

  const isLoading = result.key !== requestKey
  const hasMyRank = boardId === 'exp' || boardId === 'monthly'
  const monthNumber = Number(formatPostDate(new Date().toISOString()).slice(5, 7))

  const items = result.items.map((entry) => toItem(boardId, entry, userId))
  const podiumItems = items.slice(0, 3)
  const restItems = items.slice(3)

  return (
    <Box component="section" aria-label={label}>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2, wordBreak: 'keep-all' }}>
        {boardId === 'monthly' ? `${monthNumber}월 · ` : ''}
        {DESCRIPTIONS[boardId]}
      </Typography>

      {hasMyRank && !isLoading && !result.errorMessage && <MyRankCard boardId={boardId} profile={profile} ready={ready} me={result.me} />}

      {isLoading ? (
        <StatusMessage mood="loading" title="순위를 불러오고 있어요" description="잠시만 기다려 주세요." />
      ) : result.errorMessage ? (
        <StatusMessage mood="error" title="순위를 불러오지 못했어요" description={result.errorMessage} actionLabel="다시 시도" onAction={() => setRetryCount((count) => count + 1)} />
      ) : items.length === 0 ? (
        <StatusMessage mood="empty" title={EMPTY[boardId].title} description={EMPTY[boardId].description} />
      ) : (
        <>
          <RankingPodium items={podiumItems} />
          {restItems.length > 0 && (
            <Box component="ol" start={4} sx={{ listStyle: 'none', m: 0, p: 0, ...PARCHMENT_SX, borderRadius: '18px', overflow: 'hidden' }}>
              {restItems.map((item) => (
                <RankingListItem key={item.rank} {...item} />
              ))}
            </Box>
          )}
        </>
      )}

      {!isLoading && !result.errorMessage && items.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
          <Typography component={Link} to={EMPTY[boardId].to} sx={{ fontWeight: 800, color: 'primary.main', py: 1.25, px: 2 }}>
            {EMPTY[boardId].actionLabel}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default AccountRankingBoard
