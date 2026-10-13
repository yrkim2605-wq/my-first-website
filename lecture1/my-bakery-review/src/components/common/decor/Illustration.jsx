import Box from '@mui/material/Box'
import croissant from '../../../assets/illustrations/illust-croissant.webp'
import mascot from '../../../assets/illustrations/illust-mascot.webp'
import loaf from '../../../assets/illustrations/illust-loaf.webp'
import strawberryCake from '../../../assets/illustrations/illust-strawberry-cake.webp'
import breadBasket from '../../../assets/illustrations/illust-bread-basket.webp'

// 스티커 시트(스티커.png)에서 하나씩 잘라낸 빵 일러스트예요. 투명 배경 · 원본 크기 그대로라서
// 화면에서는 원본보다 작게만 써요 (크게 늘리면 흐려져요).
const ILLUSTRATIONS = {
  croissant,
  mascot,
  loaf,
  strawberryCake,
  breadBasket,
}

// 꾸밈용 그림: 클릭을 막지 않고(pointer-events: none), 화면 읽기 프로그램은 건너뛰어요.
// width만 정하면 높이는 원본 비율대로 따라가요.
const Illustration = ({ name, width, sx }) => (
  <Box
    component="img"
    src={ILLUSTRATIONS[name]}
    alt=""
    aria-hidden="true"
    draggable={false}
    loading="lazy"
    sx={{ width, height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none', ...sx }}
  />
)

export default Illustration
