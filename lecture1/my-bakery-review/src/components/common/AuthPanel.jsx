import Box from '@mui/material/Box'
import WoodPanel from './WoodPanel'
import Sticker from './decor/Sticker'

// 로그인 · 회원가입 카드예요. 카드 모양은 WoodPanel 그대로이고, 꾸밈 그림만 얹어요.
//  - 좁은 화면(모바일 · 태블릿 세로): 카드 위로 빼꼼 내다보는 빵 기사
//  - 넓은 화면(PC): 카드 왼쪽에 빵 기사, 오른쪽에 소품 (카드 바깥 빈 자리를 채워요)
// 꾸밈 그림은 클릭을 막지 않고 화면 읽기 프로그램도 건너뛰어서 폼 사용에는 영향이 없어요.
const AuthPanel = ({ knight = 'knight-map', prop = 'signpost', children }) => (
  <Box sx={{ position: 'relative', width: '100%', mt: { xs: 5, md: 0 } }}>
    <Sticker
      name="knight-peek"
      width={104}
      sx={{ display: { xs: 'block', md: 'none' }, position: 'absolute', right: 22, bottom: 'calc(100% - 12px)', zIndex: 0 }}
    />
    <Sticker
      name={knight}
      width={168}
      float
      sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', left: -196, bottom: 6 }}
    />
    <Sticker name={prop} width={prop === 'signpost' ? 84 : 112} sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: -136, bottom: 0 }} />
    <WoodPanel variant="light" sx={{ p: 3, width: '100%', position: 'relative', zIndex: 1 }}>
      {children}
    </WoodPanel>
  </Box>
)

export default AuthPanel
