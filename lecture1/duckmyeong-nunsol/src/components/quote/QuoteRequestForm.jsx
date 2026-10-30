import { useState } from 'react'
import { Box, Button, TextField, Typography } from '@mui/material'
import { MAX_FILE_SIZE_MB } from '../../utils/validateFile'
import { formatPhone, isValidPhone } from '../../utils/formatPhone'
import FileField from './FileField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// kind: 'phone'은 입력하는 대로 하이픈을 넣고 형식을 검사, 'email'은 이메일 형식을 검사
const FIELDS = [
  { name: 'company', label: '상호', required: true, autoComplete: 'organization' },
  { name: 'region', label: '지역', placeholder: '예: 부산 해운대구', autoComplete: 'address-level2' },
  { name: 'name', label: '성명', required: true, autoComplete: 'name' },
  { name: 'position', label: '직책', autoComplete: 'organization-title' },
  { name: 'phone', label: '전화번호', kind: 'phone', placeholder: '051-000-0000', autoComplete: 'tel' },
  { name: 'mobile', label: '휴대전화', kind: 'phone', required: true, placeholder: '010-0000-0000', autoComplete: 'tel' },
  { name: 'email', label: '이메일', kind: 'email', required: true, autoComplete: 'email' },
  { name: 'fax', label: '팩스', kind: 'phone', placeholder: '051-000-0000' },
]

const FILE_FIELDS = [
  { name: 'license', label: '사업자등록증' },
  { name: 'attachment1', label: '견적첨부파일1' },
  { name: 'attachment2', label: '견적첨부파일2' },
]

const INITIAL_VALUES = Object.fromEntries(FIELDS.map(({ name }) => [name, '']))
const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map(({ name }) => [name, { file: null, error: '' }]))

const getError = ({ required, kind }, value) => {
  if (!value.trim()) return required ? '필수 입력 항목이에요' : ''
  if (kind === 'phone' && !isValidPhone(value)) return '번호 형식을 확인해 주세요 (예: 010-1234-5678)'
  if (kind === 'email' && !EMAIL_PATTERN.test(value)) return '이메일 형식을 확인해 주세요 (예: name@company.com)'
  return ''
}

// 견적 요청 정보 입력 (요청자 정보는 저장하지 않고, 제출하면 비워짐)
const QuoteRequestForm = ({ onSubmit, onEmptyList, hasItems }) => {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [isTouched, setIsTouched] = useState(false)

  const errors = Object.fromEntries(FIELDS.map((field) => [field.name, getError(field, values[field.name])]))
  const hasFileError = Object.values(files).some(({ error }) => error)
  const hasError = Object.values(errors).some(Boolean) || hasFileError

  const handleChange = (field) => (event) => {
    const value = field.kind === 'phone' ? formatPhone(event.target.value) : event.target.value
    setValues((prev) => ({ ...prev, [field.name]: value }))
  }

  const handleFileChange = (name) => (next) => {
    setFiles((prev) => ({ ...prev, [name]: next }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsTouched(true)
    if (!hasItems) {
      onEmptyList()
      return
    }
    if (hasError) return
    onSubmit(values)
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
        {FIELDS.map((field) => (
          <TextField
            key={field.name}
            size="small"
            label={field.label}
            required={field.required}
            type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            onChange={handleChange(field)}
            error={isTouched && Boolean(errors[field.name])}
            helperText={isTouched && errors[field.name] ? errors[field.name] : ' '}
            slotProps={field.kind === 'phone' ? { htmlInput: { inputMode: 'tel' } } : undefined}
          />
        ))}
      </Box>

      <Box sx={{ mt: 1 }}>
        {FILE_FIELDS.map(({ name, label }) => (
          <FileField key={name} label={label} value={files[name]} onChange={handleFileChange(name)} />
        ))}
        <Typography variant="caption" color="text.secondary">
          pdf, jpg, png, xls, xlsx 파일 · 파일당 {MAX_FILE_SIZE_MB}MB 이하 (데모라 파일은 서버로 전송되지 않아요)
        </Typography>
      </Box>

      <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }}>
        견적 요청하기
      </Button>
    </Box>
  )
}

export default QuoteRequestForm
