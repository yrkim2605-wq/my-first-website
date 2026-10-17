import Box from '@mui/material/Box'

// 스티커 시트(캐릭터1 · 요소 · 스티커1)에서 잘라낸 꾸밈 그림이에요. 투명 배경이라 어디에나 얹을 수 있어요.
// src/assets/stickers/<이름>.webp 를 이름으로 불러요 (예: <Sticker name="knight-map" width={120} />).
//  - 캐릭터: knight-map · hooray · peek · nap · coffee · cream · chef · book · camera · pack · search · toast · breadbed · sweat · heart · scope
//  - 보상: levelup · crown · gem-ruby · gem-sapphire · medal-gold · medal-silver · medal-bronze · heart · sparkle
//  - 빵: bread-croissant · melon · eclair · strawberry · cupcake · boule · loaf · cinnamon · pretzel · muffin · macaron · cookie
//  - 풍경: grass-strip · bush · bench · fence · signpost · flower · cloud · cloud-flower · flag · banner-lamp
//  - 마을 소품 (홈 장식용으로 요소.png에서 새로 잘랐어요): barrel · lamp-post · chalkboard · camp-birdhouses(새집 · 우체통 · 그루터기 장면) · stall(가판대) · sign-vines · sign-hanging(글자 없는 나무 간판)
//  - 말풍선: bubble-pin · bubble-heart · bubble-alert · bubble-question · bubble-music
//  - 풀 · 꽃: bush-flowers · bush-leafy · plant-leaf · flower-white · flower-yellow
//  - 덤불 시트(덤불.png)에서 잘라낸 큰 덤불: grove-rock · grove-rocks · grove-stones · grove-stump · grove-fence · grove-long · grove-low · grove-round · grove-white · grove-leaf · grove-leaf-rock · grove-grass · grove-strip
// 원본 크기가 작아서 화면에서는 원본 가로(대부분 100~300px)보다 크게 쓰지 않아요 (늘리면 흐려져요).
const STICKER_URLS = Object.fromEntries(
  Object.entries(import.meta.glob('../../../assets/stickers/*.webp', { eager: true, query: '?url', import: 'default' })).map(([file, url]) => [
    file.split('/').pop().replace('.webp', ''),
    url,
  ]),
)

// 꾸밈용 그림: 클릭을 막지 않고(pointer-events: none), 화면 읽기 프로그램은 건너뛰어요.
// float: 천천히 위아래로 떠다녀요 (움직임 줄이기 설정을 켠 사람에게는 멈춰요)
// eager: 첫 화면처럼 바로 보여야 하는 그림은 true로 (기본은 화면에 가까워질 때 불러와요)
const Sticker = ({ name, width, float = false, eager = false, className, sx }) => {
  const url = STICKER_URLS[name]
  if (!url) return null
  return (
    <Box
      component="img"
      src={url}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      className={[float ? 'float-soft' : '', className].filter(Boolean).join(' ') || undefined}
      sx={{ width, height: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none', ...sx }}
    />
  )
}

export default Sticker
