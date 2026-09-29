import Box from '@mui/material/Box';

// 데스크톱에서 섹션을 창 높이(height)에 맞추고, 그 안의 무대(stage)를
// 시안 비율(ratio)을 유지한 채 창의 가로·세로 중 좁은 쪽에 맞춰 줄인다 (letterbox, 잘리는 내용 없음).
// 무대 안에서는 cqw가 무대 너비 기준이라, 기존 cqw 값들을 그대로 쓸 수 있다.
// fullWidth: true면 세로가 넘쳐도(overflow: hidden으로 위아래가 살짝 잘리더라도) 항상 가로를 꽉 채운다
//   — 히어로처럼 좌우 여백 없이 화면을 가득 채우는 배경형 섹션에서만 쓴다.
//   BACK·SCROLL처럼 화면 가장자리에 걸린 UI가 있는 화면은 반드시 기본값(false)을 써야 잘리지 않는다.
const FitStage = ({
  id,
  ref,
  ratio: [w, h],
  height = '100svh',
  fullWidth = false,
  sx = {},
  stageSx = {},
  children,
}) => {
  return (
    <Box
      id={id}
      ref={ref}
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        height: { md: height },
        containerType: { md: 'size' },
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          containerType: 'inline-size',
          width: { xs: '100%', md: fullWidth ? '100%' : `min(100cqw, calc(100cqh * ${w} / ${h}))` },
          aspectRatio: { md: `${w} / ${h}` },
          ...stageSx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default FitStage;
