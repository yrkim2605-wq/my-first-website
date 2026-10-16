import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Illustration from './decor/Illustration'
import { getBakeryReviewPhoto } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../hooks/useRealBakeryPhotos'
import { PARCHMENT_SX } from '../../constants/rpgStyles'

export const PHOTO_PLACEHOLDER_TEXT = '첫 번째 빵 사진을 기다리고 있어요!'

// 좁은 칸(찜 목록의 작은 동그라미 등)에서는 글자를 숨기고 빵 기사만 크게 보여줘요 (칸 너비 기준, container query)
const SMALL = '@container (max-width: 150px)'

// 사진이 없을 때 아치 안을 채우는 그림: 양피지 바탕 + 카메라를 든 빵 기사 + 안내 문구.
// 실제 사진이 아니라는 걸 문구로 분명히 알려요. 부모(아치 프레임)가 크기를 정하고, 이 그림은 그 안을 가득 채워요.
export const PhotoPlaceholder = ({ label, className, sx }) => (
  <Box
    role="img"
    aria-label={label}
    className={className}
    sx={{
      width: '100%',
      height: '100%',
      containerType: 'inline-size',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center', // 위쪽이 둥근 아치라서 가운데에 두면 가장자리에 잘리지 않아요
      // cqw는 자기 자신의 여백에는 쓸 수 없어서(바깥 화면 기준으로 계산돼요) 고정값을 써요
      gap: 0.75,
      pt: 1,
      // 양피지 카드 위에서도 아치 모양이 보이도록 한 톤 밝은 바탕 + 아치를 따라가는 얇은 테두리 + 빵 기사 뒤 은은한 금빛
      backgroundColor: '#fdf4d8',
      backgroundImage: `radial-gradient(circle at 50% 52%, rgba(248,213,122,0.5) 0%, rgba(248,213,122,0) 62%), ${PARCHMENT_SX.backgroundImage}`,
      borderRadius: 'inherit',
      boxShadow: 'inset 0 0 0 2px rgba(201,165,106,0.65)',
      overflow: 'hidden',
      ...sx,
    }}
  >
    {/* 칸이 낮으면(maxHeight) 빵 기사를 비율 그대로 줄여요. 아주 좁은 칸은 칸 너비의 84%로 크게 보여줘요 */}
    <Illustration
      name="knightCamera"
      width="min(62cqw, 260px)"
      sx={{ flexShrink: 1, minHeight: 0, maxHeight: '62%', objectFit: 'contain', [SMALL]: { width: '84cqw', maxHeight: '100%' } }}
    />
    <Typography
      component="span"
      aria-hidden="true"
      sx={{
        px: 1.5,
        fontSize: 'clamp(0.72rem, 4.4cqw, 1.05rem)',
        fontWeight: 800,
        lineHeight: 1.35,
        textAlign: 'center',
        color: '#6b4423',
        wordBreak: 'keep-all',
        textWrap: 'balance',
        [SMALL]: { display: 'none' },
      }}
    >
      {PHOTO_PLACEHOLDER_TEXT}
    </Typography>
  </Box>
)

// 빵집 사진 한 장: 실제 리뷰 사진이 있으면 그 사진, 없거나 불러오지 못하면(파일이 지워졌을 때 등) 플레이스홀더.
// 카드 · 상세 · 지도 미리보기 · 마이페이지 · 리뷰 카드가 모두 이 컴포넌트를 써서 기준이 같아요.
// 크기와 모양(아치 · 동그라미)은 부모가 정해요. className · sx는 사진과 플레이스홀더에 똑같이 적용돼요.
const BakeryPhoto = ({ bakeryId, name, className, sx }) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const src = getBakeryReviewPhoto(bakeryId, photosByBakeryId)
  const [failedSrc, setFailedSrc] = useState(null) // 이 주소는 못 불러왔다고 기억해요 (새 사진으로 바뀌면 다시 시도해요)

  if (!src || failedSrc === src) {
    return (
      <PhotoPlaceholder
        label={`${name}: ${src ? '사진을 불러오지 못했어요' : '아직 등록된 사진이 없어요'}`}
        className={className}
        sx={sx}
      />
    )
  }

  return (
    <Box
      component="img"
      src={src}
      alt={name}
      loading="lazy"
      className={className}
      onError={() => setFailedSrc(src)}
      sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', ...sx }}
    />
  )
}

export default BakeryPhoto
