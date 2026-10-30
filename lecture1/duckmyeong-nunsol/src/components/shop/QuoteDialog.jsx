import { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import useShop from '../../hooks/useShop'

const INITIAL_FORM = { company: '', name: '', phone: '', quantity: '1', memo: '' }

// 숫자만 남기고 010-1234-5678 / 051-123-4567 / 1644-9879 형태로 보기 좋게 맞춤
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.startsWith('02')) return digits.replace(/^(\d{2})(\d{3,4})(\d{0,4})$/, '$1-$2-$3').replace(/-$/, '')
  if (digits.length <= 8) return digits.replace(/^(\d{4})(\d{0,4})$/, '$1-$2').replace(/-$/, '')
  return digits.replace(/^(\d{3})(\d{3,4})(\d{0,4})$/, '$1-$2-$3').replace(/-$/, '')
}

const isValidPhone = (value) => /^\d{2,4}-\d{3,4}(-\d{4})?$/.test(value)

// 가격문의 상품의 견적 요청 창 (데모: 서버로 보내지 않고 접수 안내만 보여줌)
const QuoteDialog = ({ product, onClose }) => {
  const { notify } = useShop()
  const [form, setForm] = useState(INITIAL_FORM)
  const [isTouched, setIsTouched] = useState(false)

  const errors = {
    name: form.name.trim() ? '' : '담당자 성함을 입력해 주세요',
    phone: isValidPhone(form.phone) ? '' : '연락 가능한 전화번호를 입력해 주세요',
    quantity: Number(form.quantity) >= 1 ? '' : '수량은 1 이상이어야 해요',
  }
  const hasError = Object.values(errors).some(Boolean)

  const handleChange = (field) => (event) => {
    const value = field === 'phone' ? formatPhone(event.target.value) : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    onClose()
    setIsTouched(false)
    setForm(INITIAL_FORM)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsTouched(true)
    if (hasError) return
    notify('요청이 접수되었어요. 영업일 기준 1일 이내에 연락드릴게요.')
    handleClose()
  }

  const fieldProps = (field) => ({
    value: form[field],
    onChange: handleChange(field),
    error: isTouched && Boolean(errors[field]),
    helperText: isTouched ? errors[field] : ' ',
    fullWidth: true,
    size: 'small',
    sx: { mb: 0.5 },
  })

  return (
    <Dialog open={Boolean(product)} onClose={handleClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>견적·상담 요청</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1.5, mb: 2.5, bgcolor: '#F7F7F8', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              요청 항목
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'keep-all' }}>
              {product?.name}
            </Typography>
          </Box>
          <TextField label="회사명 (선택)" {...fieldProps('company')} error={false} helperText=" " />
          <TextField label="담당자 성함" required autoComplete="name" {...fieldProps('name')} />
          <TextField
            label="연락처"
            required
            autoComplete="tel"
            placeholder="010-0000-0000"
            slotProps={{ htmlInput: { inputMode: 'tel' } }}
            {...fieldProps('phone')}
          />
          <TextField
            label="수량"
            type="number"
            slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
            {...fieldProps('quantity')}
          />
          <TextField label="요청 사항 (선택)" multiline minRows={2} {...fieldProps('memo')} error={false} helperText=" " />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={handleClose}>
            취소
          </Button>
          <Button type="submit" variant="contained">
            요청하기
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default QuoteDialog
