import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading'
import Reveal from '../common/Reveal'
import XpProgressBar from '../common/XpProgressBar'
import WoodButton from '../common/WoodButton'
import Illustration from '../common/decor/Illustration'
import { LEVELS } from '../../constants/levels'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { useGameState } from '../../hooks/useGameState'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// levels.js의 실제 기준으로 "EXP 180" 같은 문구를 만들어요
const getCriteriaParts = (level) => (level.minExp === 0 ? ['누구나 여기서 시작'] : [`EXP ${level.minExp}`])

const describeCriteria = (level) => getCriteriaParts(level).join(' · ')

// 모험가 길드: 레벨을 성장 단계(길)로 보여주고, 내 상태창(경험치 바)을 함께 보여줘요.
// 레벨 계산은 헤더 · 마이페이지와 같은 getLevelProgress를 써서 값이 항상 같아요.
// 메달이나 버튼을 누르면 마이페이지로 가요.
const LevelUpTeaser = () => {
  const { progress, profile, isLoading, loadError, reloadReviews } = useGameState()
  // 계정 모드에서 내 기록을 아직 모르면(불러오는 중 · 실패) 레벨을 Lv.1로 표시하지 않아요
  const isRecordUnknown = isLoading || Boolean(loadError)
  const currentIndex = isRecordUnknown ? -1 : progress.currentIndex

  return (
    <Container maxWidth="lg" component="section" aria-labelledby="level-up-title" sx={{ pt: { xs: 6, md: 8 } }}>
      <Reveal>
      <Box
        sx={{
          position: 'relative',
          maxWidth: 1040,
          mx: 'auto',
          px: { xs: 2, sm: 5 },
          pt: { xs: 3.5, sm: 4.5 },
          pb: { xs: 3, sm: 4 },
          ...PARCHMENT_SX,
          borderRadius: '24px',
        }}
      >
        <SectionHeading
          variant="sign"
          eyebrow="ADVENTURERS GUILD"
          title="모험가 길드"
          titleId="level-up-title"
          description="리뷰를 남기고 퀘스트를 완료하면 EXP가 쌓여 레벨이 오르고, 특별한 메달을 받아요."
          sx={{ mb: { xs: 3, sm: 4 } }}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' },
            alignItems: 'center',
            gap: { xs: 2, md: 4 },
          }}
        >
          {/* 길드 안내 담당 빵 기사: 좁은 화면에서는 숨겨요 */}
          <Illustration name="knightRun" width={150} className="float-soft" sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* 성장 단계: Lv.1 → Lv.5. 도달한 단계는 밝게, 아직인 단계는 흐리게 보여요. */}
          <Box
            component="ul"
            aria-label="레벨 성장 단계"
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: { xs: 0.25, sm: 1 },
              // 메달 뒤를 잇는 점선 길
              '&::before': {
                content: '""',
                position: 'absolute',
                top: { xs: 41, sm: 49 },
                left: '10%',
                right: '10%',
                borderTop: '3px dashed #c9a56a',
              },
            }}
          >
            {LEVELS.map((level, index) => {
              const reached = index <= currentIndex
              const isCurrent = index === currentIndex
              return (
                <Box component="li" key={level.id} sx={{ position: 'relative', zIndex: 1 }}>
                  <Box
                    component={Link}
                    to="/mypage"
                    aria-label={`Lv.${index + 1} ${level.name}: ${describeCriteria(level)}${isCurrent ? ' (현재 레벨)' : ''}. 마이페이지에서 내 레벨 보기`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      px: 0.25,
                      py: 0.5,
                      borderRadius: RADIUS.lg,
                      color: 'inherit',
                      textDecoration: 'none',
                      transition: 'transform 0.2s ease',
                      '@media (hover: hover)': { '&:hover': { transform: 'translateY(-3px)' } },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                    }}
                  >
                    {/* 현재 레벨 표시 (자리는 항상 잡아서 메달 높이가 맞아요) */}
                    <Box sx={{ height: 20, mb: 0.25, display: 'flex', alignItems: 'flex-end' }}>
                      {isCurrent && (
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            borderRadius: RADIUS.pill,
                            bgcolor: 'wood.main',
                            color: 'gold.light',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            lineHeight: 1.7,
                          }}
                        >
                          현재
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        width: { xs: 58, sm: 74 },
                        height: { xs: 58, sm: 74 },
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: RADIUS.round,
                        bgcolor: 'parchment.light',
                        border: '3px solid',
                        borderColor: isCurrent ? 'gold.main' : 'parchment.edge',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(226,176,74,0.35)' : 'none',
                        opacity: reached ? 1 : 0.5,
                        filter: reached ? 'none' : 'grayscale(0.5)',
                      }}
                    >
                      <Box
                        component="img"
                        src={level.iconImage}
                        alt=""
                        sx={{ width: '82%', height: '82%', objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})` }}
                      />
                    </Box>
                    <Typography sx={{ mt: 0.75, fontSize: '0.7rem', fontWeight: 800, color: 'terracotta.dark', lineHeight: 1.2 }}>
                      Lv.{index + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 900,
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        color: reached ? 'primary.main' : 'text.secondary',
                        wordBreak: 'keep-all',
                        textAlign: 'center',
                      }}
                    >
                      {level.name}
                    </Typography>
                    <Typography
                      component="div"
                      sx={{
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        color: 'text.secondary',
                        textAlign: 'center',
                        lineHeight: 1.4,
                        mt: 0.25,
                        wordBreak: 'keep-all',
                      }}
                    >
                      {getCriteriaParts(level).map((part) => (
                        <Box key={part} component="span" sx={{ display: 'block' }}>
                          {part}
                        </Box>
                      ))}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Box>

        {/* 내 상태창: 현재 레벨, 다음 레벨까지 남은 양 (실제 계산값) */}
        <Box
          sx={{
            mt: { xs: 3, sm: 4 },
            p: { xs: 2, sm: 2.5 },
            borderRadius: RADIUS.lg,
            bgcolor: 'butter.main',
            border: '2px solid',
            borderColor: 'parchment.edge',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: 'terracotta.dark', mb: 1 }}>
              {profile ? `${profile.nickname}의 모험가 상태` : '내 모험가 상태 · 로그인하면 기록이 쌓여요'}
            </Typography>
            {isLoading ? (
              <Typography role="status" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                내 기록을 불러오고 있어요…
              </Typography>
            ) : loadError ? (
              <Box role="alert" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
                  내 기록을 불러오지 못했어요. {loadError}
                </Typography>
                <Button onClick={reloadReviews} size="small" variant="outlined">
                  다시 시도
                </Button>
              </Box>
            ) : (
              <XpProgressBar
                levelName={progress.currentLevel.name}
                nextLevelName={progress.nextLevel?.name}
                percent={progress.percent}
                exp={progress.exp}
                expToNext={progress.expToNext}
                isMaxLevel={progress.isMaxLevel}
              />
            )}
          </Box>
          <WoodButton component={Link} to="/mypage" size="sm" sx={{ justifySelf: { xs: 'stretch', sm: 'auto' } }}>
            내 레벨과 메달 보기
          </WoodButton>
        </Box>
      </Box>
      </Reveal>
    </Container>
  )
}

export default LevelUpTeaser
