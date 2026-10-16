import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

// 빵집 정보를 불러오는 동안 BakeryStageCard 자리에 보여주는 뼈대 카드예요.
// compactMobile: BakeryStageCard의 같은 옵션과 짝이에요. 폰(600px 미만)에서만 "왼쪽 사진 + 오른쪽 정보" 가로형 뼈대로 보여줘서,
// 불러온 뒤 카드로 바뀔 때 화면이 덜 흔들려요. 그 위 화면은 기존 세로 뼈대 그대로예요.
const BakeryCardSkeleton = ({ compactMobile = false }) => {
  const pick = (compact, regular) => (compactMobile ? { xs: compact, sm: regular } : regular)
  return (
    <Card
      elevation={0}
      aria-hidden="true"
      sx={{
        display: compactMobile ? 'flex' : undefined,
        flexDirection: pick('row', 'column'),
        alignItems: compactMobile ? { xs: 'center', sm: 'stretch' } : undefined,
        height: '100%',
        bgcolor: 'background.paper',
        border: '1px solid rgba(46,42,37,0.07)',
        boxShadow: '0 1px 3px rgba(46,42,37,0.05)',
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          flexShrink: 0,
          width: compactMobile ? { xs: 88, sm: 'auto' } : undefined,
          height: pick(88, 190),
          mx: pick(1.25, 1.5),
          mt: pick(1.25, 1.5),
          mb: pick(1.25, 0),
          borderRadius: '999px 999px 14px 14px',
        }}
      />
      <CardContent sx={compactMobile ? { flex: 1, minWidth: 0, pl: { xs: 0, sm: 2 }, pr: { xs: 1.25, sm: 2 }, py: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 3 } } } : undefined}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Skeleton animation="wave" width="55%" height={28} />
          <Skeleton animation="wave" variant="rounded" width={48} height={24} sx={{ borderRadius: 999 }} />
        </Box>
        <Skeleton animation="wave" width="40%" sx={{ mb: 1.5 }} />
        <Skeleton animation="wave" width="35%" sx={{ mb: 1 }} />
        <Box sx={{ display: pick('none', 'flex'), gap: 0.5, mt: 1.5 }}>
          <Skeleton animation="wave" variant="rounded" width={52} height={24} sx={{ borderRadius: 999 }} />
          <Skeleton animation="wave" variant="rounded" width={52} height={24} sx={{ borderRadius: 999 }} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default BakeryCardSkeleton
