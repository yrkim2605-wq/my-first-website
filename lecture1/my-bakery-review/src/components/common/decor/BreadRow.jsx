import Box from '@mui/material/Box'
import Sticker from './Sticker'

// 빵 아이콘을 한 줄로 늘어놓은 장식 구분선이에요 (목록의 끝, 섹션 사이 같은 자리).
// 꾸밈용이라 클릭을 막지 않고 화면 읽기 프로그램도 건너뛰어요. 좁은 화면에서는 3개만 보여요.
const BREADS = [
  { name: 'bread-croissant', width: 42, tilt: -8 },
  { name: 'bread-melon', width: 36, tilt: 6 },
  { name: 'bread-boule', width: 44, tilt: -4 },
  { name: 'bread-cookie', width: 32, tilt: 10 },
  { name: 'bread-cupcake', width: 32, tilt: -6 },
]

const BreadRow = ({ sx }) => (
  <Box aria-hidden="true" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 1.5, sm: 2.5 }, ...sx }}>
    {BREADS.map((bread, index) => (
      <Sticker
        key={bread.name}
        name={bread.name}
        width={bread.width}
        sx={{ transform: `rotate(${bread.tilt}deg)`, display: index === 0 || index === 4 ? { xs: 'none', sm: 'block' } : 'block' }}
      />
    ))}
  </Box>
)

export default BreadRow
