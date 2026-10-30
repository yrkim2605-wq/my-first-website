import { Box, Paper, Typography } from '@mui/material'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import { COMPANY_INFO } from '../../constants/siteData'

const COMPANY_ROWS = [
  ['상호', COMPANY_INFO.name],
  ['등록번호', COMPANY_INFO.businessNumber],
  ['전화번호', COMPANY_INFO.officeTel],
  ['E-mail', COMPANY_INFO.email],
  ['계좌번호', COMPANY_INFO.bank],
  ['예금주', COMPANY_INFO.accountHolder],
]

// 견적서에 함께 안내되는 회사 정보와 고객센터
const QuoteSidebar = () => {
  return (
    <Box component="aside" aria-label="회사 정보와 고객센터" sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75 }}>
          {COMPANY_ROWS.map(([term, description]) => (
            <Box key={term} sx={{ display: 'contents' }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                {term}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 500, wordBreak: 'break-all' }}>
                {description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderTop: '3px solid', borderTopColor: 'secondary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <HeadsetMicOutlinedIcon sx={{ color: 'primary.main' }} />
          <Typography sx={{ fontWeight: 700 }}>고객센터</Typography>
          <Typography component="a" href={`tel:${COMPANY_INFO.tel.replace(/-/g, '')}`} sx={{ ml: 'auto', fontSize: '1.375rem', fontWeight: 700, color: 'primary.main' }}>
            {COMPANY_INFO.tel}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'keep-all', lineHeight: 1.7 }}>
          찾으시는 제품이 없거나 어려우시면 전화로 문의해 주세요. 빠르게 안내해 드릴게요. {COMPANY_INFO.hours}
        </Typography>
      </Paper>
    </Box>
  )
}

export default QuoteSidebar
