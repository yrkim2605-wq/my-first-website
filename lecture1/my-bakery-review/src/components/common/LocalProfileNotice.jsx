import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { RADIUS } from '../../theme'
import { IS_ACCOUNT_MODE } from '../../lib/backend'

// "이 기록은 이 브라우저에만 저장돼요"를 알리는 안내 상자예요.
// 포트폴리오 테스트 단계라 서버가 없어서, 로그인 · 리뷰 · 경험치가 모두 이 브라우저 안에서만 쓰여요.
// 다른 사용자와 공유되는 것처럼 보이지 않도록, 관련된 화면에서 이 안내를 보여줘요.
// 계정 모드에서는 "이 브라우저에만 저장" 문구가 사실과 다르므로 아래 안내로 바꿔요.
// (예시 데이터를 설명하는 안내처럼 저장 방식과 상관없는 문구는 always를 줘서 그대로 보여줘요.)
const ACCOUNT_MODE_TEXT = (
  <>
    <b>계정 모드(개발 중)</b>예요. 모험 일지 · EXP · 배지 · 방문 체크는 <b>내 계정에 저장</b>돼요. 커뮤니티 글은 아직 연결되지 않아서
    <b> 저장되지 않아요</b>. 이 브라우저에 있던 기존 기록은 지워지지 않고 그대로 남아 있어요.
  </>
)

// accountChildren: 계정 모드에서 이 화면에 맞는 문구를 따로 주고 싶을 때 (없으면 위의 기본 문구)
const LocalProfileNotice = ({ children, accountChildren, always = false, sx }) => (
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
      {IS_ACCOUNT_MODE && !always ? (accountChildren ?? ACCOUNT_MODE_TEXT) : children ?? (
        <>
          <b>이 브라우저에만 저장되는 임시 프로필</b>이에요. 비밀번호가 없고, 다른 사람이나 다른 기기와 기록이 공유되지 않아요.
          사이트 데이터를 지우면 기록도 함께 사라져요.
        </>
      )}
    </Typography>
  </Box>
)

export default LocalProfileNotice
