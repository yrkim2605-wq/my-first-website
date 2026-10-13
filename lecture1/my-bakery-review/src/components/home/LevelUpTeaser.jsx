import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import WavyDivider from '../common/decor/WavyDivider'
import FlatFlower from '../common/decor/FlatFlower'
import { LEVELS } from '../../constants/levels'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 대표로 보여줄 레벨: Lv.1 · Lv.3 · Lv.5
const FEATURED_LEVEL_INDEXES = [0, 2, 4]

// levels.js의 실제 기준으로 "방문 15곳 · 하트 100개" 같은 문구를 만들어요
const getCriteriaParts = (level) =>
  level.minVisits === 0 && level.minHearts === 0
    ? ['누구나 여기서 시작']
    : [`방문 ${level.minVisits}곳`, level.minHearts > 0 && `하트 ${level.minHearts}개`].filter(Boolean)

const describeCriteria = (level) => getCriteriaParts(level).join(' · ')

// 홈의 작은 레벨업 안내 띠 (이번 주 인기 리뷰 아래). 메달을 누르면 마이페이지의 레벨 영역으로 가요.
const LevelUpTeaser = () => {
  const { palette } = useTheme()

  return (
    <Container maxWidth="lg" component="section" aria-labelledby="level-up-title" sx={{ pt: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          maxWidth: 1040,
          mx: 'auto',
          // 넓은 화면: 소개 글 : 메달 = 1 : 1.15, 모바일: 위아래로
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
          alignItems: 'center',
          gap: { xs: 3, md: 5 },
          px: { xs: 2.5, sm: 5 },
          py: { xs: 4, sm: 4.5 },
          bgcolor: 'background.paper',
          border: '1px solid rgba(59,42,34,0.08)',
          borderRadius: '24px',
        }}
      >
        <FlatFlower petal={palette.mustard.main} center={palette.primary.main} size={34} sx={{ position: 'absolute', top: 14, right: 18, opacity: 0.8 }} />

        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', color: 'terracotta.main', mb: 1 }}>
            BAKERY LEVEL UP
          </Typography>
          <Typography
            id="level-up-title"
            variant="h2"
            sx={{ fontSize: { xs: '1.4rem', sm: '1.7rem' }, color: 'primary.main', wordBreak: 'keep-all' }}
          >
            빵을 좋아할수록 성장하는 나의 레벨
          </Typography>
          <WavyDivider sx={{ my: 1.25 }} />
          <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.7, wordBreak: 'keep-all' }}>
            빵집을 방문하고 하트를 모으면 레벨이 오르고, 특별한 메달을 받아요.
          </Typography>
        </Box>

        <Box
          component="ul"
          sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: { xs: 1, sm: 2 }, width: '100%', maxWidth: 460, mx: 'auto' }}
        >
          {FEATURED_LEVEL_INDEXES.map((index) => {
            const level = LEVELS[index]
            return (
              <Box component="li" key={level.id}>
                <Box
                  component={Link}
                  to="/mypage"
                  aria-label={`Lv.${index + 1} ${level.name}: ${describeCriteria(level)}. 마이페이지에서 내 레벨 보기`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    px: 0.5,
                    py: 1.25,
                    borderRadius: RADIUS.lg,
                    color: 'inherit',
                    textDecoration: 'none',
                    transition: 'transform 0.25s ease, background-color 0.25s ease',
                    '@media (hover: hover)': {
                      '&:hover': { transform: 'translateY(-3px)', bgcolor: 'rgba(123,45,59,0.05)' },
                    },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                  }}
                >
                  <Box
                    component="img"
                    src={level.iconImage}
                    alt=""
                    sx={{ width: { xs: 64, sm: 76 }, height: { xs: 64, sm: 76 }, objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})`, mb: 1 }}
                  />
                  <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'primary.main' }}>
                    {level.name}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, color: 'text.secondary', textAlign: 'center', lineHeight: 1.45, mt: 0.5, wordBreak: 'keep-all' }}>
                    {/* 좁은 화면에서는 방문 · 하트를 한 줄씩 (중간에서 어색하게 끊기지 않게) */}
                    {getCriteriaParts(level).map((part, i) => (
                      <Box key={part} component="span" sx={{ display: { xs: 'block', sm: 'inline' }, whiteSpace: 'nowrap' }}>
                        {i > 0 && (
                          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                            {' · '}
                          </Box>
                        )}
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
    </Container>
  )
}

export default LevelUpTeaser
