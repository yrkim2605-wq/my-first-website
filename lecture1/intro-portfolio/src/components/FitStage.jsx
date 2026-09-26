import Box from '@mui/material/Box';

// 데스크톱에서 섹션을 창 높이(height)에 맞추고, 그 안의 무대(stage)를
// 시안 비율(ratio)을 유지한 채 창의 가로·세로 중 좁은 쪽에 맞춰 줄인다.
// 무대 안에서는 cqw가 무대 너비 기준이라, 기존 cqw 값들을 그대로 쓸 수 있다.
const FitStage = ({
  id,
  ref,
  ratio: [w, h],
  height = '100svh',
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
          width: { xs: '100%', md: `min(100cqw, calc(100cqh * ${w} / ${h}))` },
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
