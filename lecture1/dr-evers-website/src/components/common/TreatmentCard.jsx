import { Box, Button, Card, Chip, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ImagePlaceholder from './ImagePlaceholder'

// 카드 한 장. 바깥에서 받은 props로 사진 자리, 아이콘, 제목, 설명, 태그를 그려요.
const TreatmentCard = ({ title, description, tags, Icon }) => {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 3,
        p: 2,
        height: '100%',
        bgcolor: '#f6fbfa',
        borderRadius: 4,
        boxShadow: '0 6px 24px rgba(11, 79, 74, 0.1)',
      }}
    >
      <ImagePlaceholder
        sx={{ flexShrink: 0, width: { xs: '100%', sm: 220 }, height: { xs: 200, sm: 'auto' }, minHeight: 220, borderRadius: 3 }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            mb: 2,
            borderRadius: '50%',
            bgcolor: '#dff0ee',
            color: 'primary.dark',
          }}
        >
          <Icon />
        </Box>
        <Typography
          sx={{ fontFamily: 'fontFamilySerif', fontWeight: 600, fontSize: 22, color: 'primary.dark', mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ bgcolor: '#e0f0ee', color: 'primary.dark', fontWeight: 600 }}
            />
          ))}
        </Box>
        <Box>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ bgcolor: 'primary.dark', fontSize: 12, '&:hover': { bgcolor: 'primary.main' } }}
          >
            관련 시술더보기
          </Button>
        </Box>
      </Box>
    </Card>
  )
}

export default TreatmentCard
