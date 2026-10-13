import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { RADIUS } from '../../theme'

// "이 기록은 이 브라우저에만 저장돼요"를 알리는 안내 상자예요.
// 포트폴리오 테스트 단계라 서버가 없어서, 로그인 · 리뷰 · 경험치가 모두 이 브라우저 안에서만 쓰여요.
// 다른 사용자와 공유되는 것처럼 보이지 않도록, 관련된 화면에서 이 안내를 보여줘요.
const LocalProfileNotice = ({ children, sx }) => (
  <Box
    role="note"
    sx={{
      display: 'flex',
      gap: 1,
      alignItems: 'flex-start',
      p: 1.5,
      borderRadius: RADIUS.md,
      bgcolor: 'rgba(143,166,126,0.18)',
      border: '1px dashed',
      borderColor: 'secondary.dark',
      ...sx,
    }}
  >
    <InfoOutlinedIcon sx={{ fontSize: '1.1rem', mt: 0.15, color: 'secondary.dark', flexShrink: 0 }} />
    <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'text.primary', wordBreak: 'keep-all' }}>
      {children ?? (
        <>
          <b>이 브라우저에만 저장되는 임시 프로필</b>이에요. 비밀번호가 없고, 다른 사람이나 다른 기기와 기록이 공유되지 않아요.
          사이트 데이터를 지우면 기록도 함께 사라져요.
        </>
      )}
    </Typography>
  </Box>
)

export default LocalProfileNotice
