import Box from '@mui/material/Box'

const WoodPanel = ({ children, variant = 'light', sx, ...rest }) => {
  return (
    <Box
      className={variant === 'dark' ? 'wood-panel' : 'wood-panel-light'}
      sx={{ p: 2, ...sx }}
      {...rest}
    >
      {children}
    </Box>
  )
}

export default WoodPanel
