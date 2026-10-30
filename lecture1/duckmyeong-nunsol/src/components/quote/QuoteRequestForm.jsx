import { useState } from 'react'
import { Box, Button, Collapse, TextField, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { MAX_FILE_SIZE_MB } from '../../utils/validateFile'
import { formatPhone, isValidPhone } from '../../utils/formatPhone'
import FileField from './FileField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// kind: 'phone'은 입력하는 대로 하이픈을 넣고 형식을 검사, 'email'은 이메일 형식을 검사
// isExtra: 필수가 아니라서 "추가 정보"에 접어 두는 항목
const FIELDS = [
  { name: 'company', label: '상호', required: true, autoComplete: 'organization' },
  { name: 'name', label: '성명', required: true, autoComplete: 'name' },
  { name: 'mobile', label: '휴대전화', kind: 'phone', required: true, placeholder: '010-0000-0000', autoComplete: 'tel' },
  { name: 'email', label: '이메일', kind: 'email', required: true, autoComplete: 'email' },
  { name: 'region', label: '지역', isExtra: true, placeholder: '예: 부산 해운대구', autoComplete: 'address-level2' },
  { name: 'position', label: '직책', isExtra: true, autoComplete: 'organization-title' },
  { name: 'phone', label: '전화번호', kind: 'phone', isExtra: true, placeholder: '051-000-0000', autoComplete: 'tel' },
  { name: 'fax', label: '팩스', kind: 'phone', isExtra: true, placeholder: '051-000-0000' },
]

const FILE_FIELDS = [
  { name: 'license', label: '사업자등록증' },
  { name: 'attachment1', label: '견적 첨부파일 1' },
  { name: 'attachment2', label: '견적 첨부파일 2' },
]

const REQUIRED_FIELDS = FIELDS.filter((field) => !field.isExtra)
const EXTRA_FIELDS = FIELDS.filter((field) => field.isExtra)

const INITIAL_VALUES = Object.fromEntries(FIELDS.map(({ name }) => [name, '']))
const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map(({ name }) => [name, { file: null, error: '' }]))

const getError = ({ required, kind }, value) => {
  if (!value.trim()) return required ? '필수 입력 항목이에요' : ''
  if (kind === 'phone' && !isValidPhone(value)) return '번호 형식을 확인해 주세요 (예: 010-1234-5678)'
  if (kind === 'email' && !EMAIL_PATTERN.test(value)) return '이메일 형식을 확인해 주세요 (예: name@company.com)'
  return ''
}

// 견적 요청 정보 입력 (요청자 정보는 저장하지 않고, 제출하면 비워짐). 제출 버튼은 오른쪽 요약 카드에 있음
const QuoteRequestForm = ({ formId, hasItems, onSubmit, onEmptyList }) => {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [isTouched, setIsTouched] = useState(false)
  const [isExtraOpen, setIsExtraOpen] = useState(false)

  const errors = Object.fromEntries(FIELDS.map((field) => [field.name, getError(field, values[field.name])]))
  const hasExtraError = EXTRA_FIELDS.some(({ name }) => errors[name]) || Object.values(files).some(({ error }) => error)
  const hasError = REQUIRED_FIELDS.some(({ name }) => errors[name]) || hasExtraError

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
    // 접혀 있는 칸에 오류가 있으면 펼쳐서 보여줌 (안 보이는 오류 때문에 제출이 막히지 않게)
    if (hasExtraError) setIsExtraOpen(true)
    if (!hasItems) {
      onEmptyList()
      return
    }
    if (hasError) return
    onSubmit(values)
  }

  const renderField = (field) => (
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
  )

  return (
    <Box id={formId} component="form" noValidate onSubmit={handleSubmit}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
        {REQUIRED_FIELDS.map(renderField)}
      </Box>

      <Button
        color="inherit"
        size="small"
        onClick={() => setIsExtraOpen((prev) => !prev)}
        aria-expanded={isExtraOpen}
        endIcon={<ExpandMoreIcon sx={{ transition: 'transform .2s', transform: isExtraOpen ? 'rotate(180deg)' : 'none' }} />}
        sx={{ color: 'text.secondary', mb: 1 }}
      >
        추가 정보 (선택)
      </Button>

      <Collapse in={isExtraOpen} timeout="auto">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
          {EXTRA_FIELDS.map(renderField)}
        </Box>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          {FILE_FIELDS.map(({ name, label }) => (
            <FileField key={name} label={label} value={files[name]} onChange={handleFileChange(name)} />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          pdf, jpg, png, xls, xlsx · 파일당 {MAX_FILE_SIZE_MB}MB 이하 (데모라 파일은 서버로 전송되지 않아요)
        </Typography>
      </Collapse>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        입력하신 정보는 저장되지 않고, 견적 요청에만 사용돼요.
      </Typography>
    </Box>
  )
}

export default QuoteRequestForm
