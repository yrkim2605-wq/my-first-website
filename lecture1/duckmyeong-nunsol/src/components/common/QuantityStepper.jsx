import { Box, IconButton, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { MAX_ORDER_QUANTITY } from '../../constants/siteData'

// 수량 조절 (− 숫자 +): 장바구니와 견적 목록에서 같이 사용
const QuantityStepper = ({ value, name, onChange }) => {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <IconButton size="small" aria-label={`${name} 수량 줄이기`} disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>
        {value}
      </Typography>
      <IconButton
        size="small"
        aria-label={`${name} 수량 늘리기`}
        disabled={value >= MAX_ORDER_QUANTITY}
        onClick={() => onChange(value + 1)}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}

export default QuantityStepper
