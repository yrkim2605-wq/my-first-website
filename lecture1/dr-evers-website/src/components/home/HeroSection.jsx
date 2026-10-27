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
        background: 'linear-gradient(90deg, #f4f6f8 0%, #e2e6ea 45%, #c9cfd6 100%)',
      }}
    >
      {/* 모델 사진 자리: 가운데에 세로로 길게 */}
      <ImagePlaceholder
        label="MODEL IMAGE"
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: { xs: 180, md: 300 },
          height: { xs: '55%', md: '82%' },
          borderRadius: '150px 150px 0 0',
          background: 'linear-gradient(180deg, #8a949e 0%, #5f6a74 100%)',
          opacity: 0.55,
        }}
      />

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

      {/* 오른쪽 장식 문구 */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          right: '10%',
          top: '50%',
          textAlign: 'center',
          color: '#1b2b2a',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'fontFamilySerif',
            fontWeight: 400,
            fontSize: 72,
            letterSpacing: '0.35em',
            lineHeight: 1.1,
            borderBottom: '1px solid #1b2b2a',
            pb: 1,
          }}
        >
          고주파
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 26, letterSpacing: '0.45em', mt: 3 }}>
          에버스가 묻다
        </Typography>
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
