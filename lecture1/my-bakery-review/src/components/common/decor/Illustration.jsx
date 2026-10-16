import Box from '@mui/material/Box'
import croissant from '../../../assets/illustrations/illust-croissant.webp'
import mascot from '../../../assets/illustrations/illust-mascot.webp'
import loaf from '../../../assets/illustrations/illust-loaf.webp'
import strawberryCake from '../../../assets/illustrations/illust-strawberry-cake.webp'
import breadBasket from '../../../assets/illustrations/illust-bread-basket.webp'
import knightHero from '../../../assets/illustrations/illust-knight-hero.webp'
import knightRun from '../../../assets/illustrations/illust-knight-run.webp'
import knightSleep from '../../../assets/illustrations/illust-knight-sleep.webp'
import knightCheer from '../../../assets/illustrations/illust-knight-cheer.webp'
import knightCamera from '../../../assets/illustrations/illust-knight-camera.webp'
import knightMap from '../../../assets/illustrations/illust-knight-map.webp'
import knightMagnifier from '../../../assets/illustrations/illust-knight-magnifier.webp'
import knightBook from '../../../assets/illustrations/illust-knight-book.webp'

// 스티커 시트(스티커.png)에서 하나씩 잘라낸 빵 일러스트예요. 투명 배경 · 원본 크기 그대로라서
// 화면에서는 원본보다 작게만 써요 (크게 늘리면 흐려져요).
const ILLUSTRATIONS = {
  croissant,
  mascot,
  loaf,
  strawberryCake,
  breadBasket,
  knightHero, // 바게트 칼과 빵 방패를 든 빵 기사 (대표 마스코트)
  knightRun, // 달려가는 빵 기사
  knightSleep, // 잠든 빵 기사
  knightCheer, // 두 손을 번쩍 든 빵 기사 (상반신)
  // 빵집 사진이 없을 때 쓰는 플레이스홀더 4종 (캐릭터1.png에서 분리). 어떤 빵집에 어떤 포즈를 쓸지는 constants/photoPlaceholders.js가 정해요
  knightCamera, // 카메라를 든 빵 기사 (세 번째 줄 · 세 번째 컷)
  knightMap, // 지도를 보는 빵 기사 (첫 줄 · 네 번째 컷, 위치 말풍선은 뺐어요)
  knightMagnifier, // 돋보기를 든 빵 기사 (세 번째 줄 · 다섯 번째 컷)
  knightBook, // 책을 읽는 빵 기사 (세 번째 줄 · 두 번째 컷)
}

// 꾸밈용 그림: 클릭을 막지 않고(pointer-events: none), 화면 읽기 프로그램은 건너뛰어요.
// width만 정하면 높이는 원본 비율대로 따라가요.
// eager: 첫 화면처럼 바로 보여야 하는 그림은 true로 (기본은 화면에 가까워질 때 불러와요)
const Illustration = ({ name, width, className, eager = false, sx }) => (
  <Box
    component="img"
    src={ILLUSTRATIONS[name]}
    alt=""
    aria-hidden="true"
    className={className}
    draggable={false}
    loading={eager ? 'eager' : 'lazy'}
    sx={{ width, height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none', ...sx }}
  />
)

export default Illustration
