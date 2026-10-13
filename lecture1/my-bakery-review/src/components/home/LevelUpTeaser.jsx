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
const describeCriteria = (level) =>
  level.minVisits === 0 && level.minHearts === 0
    ? '누구나 여기서 시작'
    : [`방문 ${level.minVisits}곳`, level.minHearts > 0 && `하트 ${level.minHearts}개`].filter(Boolean).join(' · ')

// 홈의 작은 레벨업 안내 띠 (이번 주 인기 리뷰 아래). 메달을 누르면 마이페이지의 레벨 영역으로 가요.
const LevelUpTeaser = () => {
  const { palette } = useTheme()

  return (
    <Container maxWidth="md" component="section" aria-labelledby="level-up-title" sx={{ pt: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 3, md: 4 },
          px: { xs: 2.5, sm: 4 },
          py: { xs: 3.5, sm: 4 },
          bgcolor: 'background.paper',
          border: '1px solid rgba(59,42,34,0.08)',
          borderRadius: '24px',
        }}
      >
        <FlatFlower petal={palette.mustard.main} center={palette.primary.main} size={34} sx={{ position: 'absolute', top: 14, right: 18, opacity: 0.8 }} />

        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', color: 'terracotta.main', mb: 1 }}>
            BAKERY LEVEL UP
          </Typography>
          <Typography
            id="level-up-title"
            variant="h2"
            sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' }, color: 'primary.main', wordBreak: 'keep-all' }}
          >
            빵을 좋아할수록 성장하는 나의 레벨
          </Typography>
          <WavyDivider sx={{ my: 1.25 }} />
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', lineHeight: 1.6, wordBreak: 'keep-all' }}>
            빵집을 방문하고 하트를 모으면 레벨이 오르고, 특별한 메달을 받아요.
          </Typography>
        </Box>

        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
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
                    width: { xs: 96, sm: 132 },
                    p: 1,
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
                    sx={{ width: { xs: 60, sm: 68 }, height: { xs: 60, sm: 68 }, objectFit: 'contain', transform: `scale(${level.iconScale ?? 1})`, mb: 0.75 }}
                  />
                  <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '0.95rem', color: 'primary.main' }}>
                    {level.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', lineHeight: 1.4, mt: 0.25, wordBreak: 'keep-all' }}>
                    {describeCriteria(level)}
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
