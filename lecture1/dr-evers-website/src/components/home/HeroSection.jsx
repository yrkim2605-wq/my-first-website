import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputBase,
  NativeSelect,
  Typography,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ImagePlaceholder from '../common/ImagePlaceholder'

const FIELD_SX = { bgcolor: '#f1f4f5', borderRadius: 1, px: 2, py: 0.5, fontSize: 14, flex: 1 }

const HeroSection = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 620, md: 'max(720px, 54vw)' },
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        pt: '59px',
        bgcolor: '#e4e7ea',
      }}
    >
      {/* 히어로 배경 사진 자리: 섹션 전체를 채워요 */}
      <ImagePlaceholder sx={{ position: 'absolute', inset: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 3, md: 7.5 }, maxWidth: 560 }}>
        <Typography
          sx={{
            fontFamily: 'fontFamilySerif',
            fontWeight: 600,
            fontSize: { xs: 32, md: 44 },
            lineHeight: 1.3,
            color: '#1b2b2a',
          }}
        >
          오늘,
          <br />
          <Box component="span" sx={{ color: 'primary.dark' }}>
            더 나다운 피부로
          </Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: 'fontFamilySerif',
            fontSize: { xs: 15, md: 18 },
            lineHeight: 1.65,
            color: '#4a5555',
            mt: 3.5,
            mb: 4,
          }}
        >
          시간이 지나도 변하지 않는,
          <br />
          건강하고 아름다운 피부를 위해
          <br />
          닥터에버스가 함께합니다.
        </Typography>
        <Button
          variant="contained"
          href="#treatment"
          endIcon={<ArrowForwardIcon />}
          sx={{ bgcolor: 'primary.dark', fontSize: 13, '&:hover': { bgcolor: 'primary.main' } }}
        >
          관련 정보 더보기
        </Button>
      </Box>

      {/* 간편 상담 신청 바 (화면만 있는 UI예요. 전송 기능은 아직 없어요) */}
      <Box
        component="form"
        onSubmit={(event) => event.preventDefault()}
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'stretch',
          position: 'absolute',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          width: 'min(940px, 92%)',
          bgcolor: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2.5,
            bgcolor: 'primary.dark',
            color: 'white',
            fontWeight: 700,
            fontSize: 17,
            whiteSpace: 'nowrap',
          }}
        >
          간편 상담 신청
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, flex: 1 }}>
          <NativeSelect
            defaultValue=""
            disableUnderline
            inputProps={{ 'aria-label': '지점 선택' }}
            sx={{ ...FIELD_SX, flex: 1.1 }}
          >
            <option value="" disabled>
              지점 선택
            </option>
            <option value="busan-seomyeon">부산서면점</option>
          </NativeSelect>
          <InputBase placeholder="이름" inputProps={{ 'aria-label': '이름' }} sx={FIELD_SX} />
          <InputBase placeholder="연락처 *" inputProps={{ 'aria-label': '연락처' }} sx={FIELD_SX} />
          <FormControlLabel
            control={<Checkbox size="small" defaultChecked />}
            label="개인정보 수집 이용동의 [보기]"
            slotProps={{ typography: { fontSize: 11.5, whiteSpace: 'nowrap' } }}
            sx={{ mx: 0.5 }}
          />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap', borderRadius: 2, px: 3 }}>
            신청하기
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default HeroSection
