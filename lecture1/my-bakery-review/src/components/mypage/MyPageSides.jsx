import Box from '@mui/material/Box'
import sideLeft from '../../assets/mypage/side-left.webp'
import sideRight from '../../assets/mypage/side-right.webp'

// 내 모험가 상태창 페이지 양옆 꾸미기: 왼쪽 깃발 · 랜턴 기둥, 오른쪽 게시판 기둥 (덩굴과 꽃이 감긴 세로 그림).
// 내용 가운데 폭은 852px이라 양옆 여백 = (100vw - 852px) / 2. 그림은 이 여백 안(최대 300px)에 들어오고 내용과 겹치지 않아요.
// 1280px보다 좁으면(태블릿 · 폰) 숨겨서 내용 중심 배치 그대로예요. 장식이라 클릭을 막지 않고 화면 읽기 프로그램은 건너뛰어요.
// 이전 크기(여백 - 16px, 최대 300px)의 90%. 화면 가장자리에 붙여요(여백 0). 높이는 auto라서 원본 비율 그대로예요.
const EDGE_GAP = 0
const SIDE_WIDTH = 'calc(clamp(120px, calc((100vw - 852px) / 2 - 16px), 300px) * 0.9)'
// 아래쪽 약 35%가 서서히 투명해져서, 기둥이 뚝 끊기지 않고 빈 공간으로 스며들어요.
const FADE_BOTTOM = 'linear-gradient(180deg, #000 0%, #000 65%, transparent 100%)'
const SIDE_SX = { position: 'absolute', top: 0, width: SIDE_WIDTH, height: 'auto', opacity: 0.7, WebkitMaskImage: FADE_BOTTOM, maskImage: FADE_BOTTOM, display: 'none', pointerEvents: 'none', userSelect: 'none', '@media (min-width: 1280px)': { display: 'block' } }

const MyPageSides = ({ children }) => (
  <Box sx={{ position: 'relative', overflowX: 'clip' }}>
    <Box component="img" src={sideLeft} alt="" aria-hidden="true" draggable={false} sx={{ ...SIDE_SX, left: EDGE_GAP }} />
    <Box component="img" src={sideRight} alt="" aria-hidden="true" draggable={false} sx={{ ...SIDE_SX, right: EDGE_GAP }} />
    <Box sx={{ position: 'relative' }}>{children}</Box>
  </Box>
)

export default MyPageSides
