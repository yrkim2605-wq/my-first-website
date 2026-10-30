import { Box, Container, Paper, Typography } from '@mui/material'
import { CATEGORIES } from '../../constants/siteData'

// 헤더 바로 아래, 히어로 위에 놓이는 카테고리 카드 (기존 덕명눈솔 쇼핑몰의 8개 분류, 같은 순서)
// 누르면 해당 분류의 상품 목록으로 이동하고, 다시 누르면 해제됨
const CategoryCards = ({ selectedId, onSelect }) => {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 2 }, pb: { xs: 2, md: 2 } }}>
      <Box
        component="nav"
        aria-label="상품 분류"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(8, 1fr)' },
          gap: { xs: 1, md: 1.5 },
        }}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedId === category.id
          return (
            <Paper
              key={category.id}
              component="button"
              type="button"
              variant="outlined"
              aria-pressed={isSelected}
              onClick={() => onSelect(category.id)}
              sx={{
                font: 'inherit',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: { xs: 1, md: 0.5 },
                px: 0.5,
                py: { xs: 1.5, md: 1 },
                borderRadius: 2,
                borderColor: isSelected ? 'primary.main' : undefined,
                bgcolor: isSelected ? '#FFF4ED' : undefined,
                cursor: 'pointer',
                transition: 'border-color .2s, background-color .2s, box-shadow .2s, transform .2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: '#FFF4ED',
                  boxShadow: '0 4px 12px rgba(242,106,27,0.15)',
                  transform: 'translateY(-2px)',
                },
                '&:hover img, &:focus-visible img': { transform: 'scale(1.08)' },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              {/* 글자 라벨이 있어서 그림은 장식용(alt 빈 값): 스크린리더가 같은 이름을 두 번 읽지 않게 */}
              <Box
                component="img"
                src={category.image}
                alt=""
                sx={{ width: 56, height: 56, objectFit: 'contain', mixBlendMode: 'multiply', transition: 'transform .2s' }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'primary.dark' : 'text.primary',
                  textAlign: 'center',
                  wordBreak: 'keep-all',
                  lineHeight: 1.4,
                  minHeight: { xs: '2.8em', md: '1.4em' },
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: { xs: '0.75rem', md: '0.8125rem' },
                }}
              >
                {category.name}
              </Typography>
            </Paper>
          )
        })}
      </Box>
    </Container>
  )
}

export default CategoryCards
