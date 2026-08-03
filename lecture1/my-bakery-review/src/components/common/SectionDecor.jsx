import Box from '@mui/material/Box'

const SectionDecor = ({ stickers }) => {
  return (
    <>
      {stickers.map((sticker, index) => {
        const keyframeName = `sectionDecorFloat-${index}-${sticker.rotate}`
        return (
          <Box
            key={index}
            component="img"
            src={sticker.src}
            alt=""
            aria-hidden="true"
            sx={{
              display: { xs: 'none', xl: 'block' },
              position: 'absolute',
              top: sticker.top,
              left: sticker.left,
              right: sticker.right,
              bottom: sticker.bottom,
              width: sticker.size,
              height: sticker.size,
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              opacity: 0.4,
              pointerEvents: 'none',
              animation: `${keyframeName} ${8 + (index % 3) * 1}s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
              [`@keyframes ${keyframeName}`]: {
                '0%, 100%': { transform: `rotate(${sticker.rotate}deg) translateY(0px)` },
                '50%': { transform: `rotate(${sticker.rotate + 2}deg) translateY(-6px)` },
              },
            }}
          />
        )
      })}
    </>
  )
}

export default SectionDecor
