import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

// 빵집 정보를 불러오는 동안 BakeryStageCard 자리에 보여주는 뼈대 카드예요.
const BakeryCardSkeleton = () => {
  return (
    <Card
      elevation={0}
      aria-hidden="true"
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        border: '1px solid rgba(46,42,37,0.07)',
        boxShadow: '0 1px 3px rgba(46,42,37,0.05)',
      }}
    >
      <Skeleton variant="rectangular" animation="wave" height={148} />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Skeleton animation="wave" width="55%" height={28} />
          <Skeleton animation="wave" variant="rounded" width={48} height={24} sx={{ borderRadius: 999 }} />
        </Box>
        <Skeleton animation="wave" width="40%" sx={{ mb: 1.5 }} />
        <Skeleton animation="wave" width="35%" sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          <Skeleton animation="wave" variant="rounded" width={52} height={24} sx={{ borderRadius: 999 }} />
          <Skeleton animation="wave" variant="rounded" width={52} height={24} sx={{ borderRadius: 999 }} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default BakeryCardSkeleton
