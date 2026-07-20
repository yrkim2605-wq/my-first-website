import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'

const PixelButton = ({
  children,
  emoji,
  to,
  onClick,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  sx,
}) => {
  const linkProps = to ? { component: Link, to } : {}

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      sx={sx}
      {...linkProps}
    >
      {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
      {children}
    </Button>
  )
}

export default PixelButton
