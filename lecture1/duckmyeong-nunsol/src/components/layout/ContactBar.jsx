import { useState } from 'react'
import { Alert, Box, ButtonBase, Container, Snackbar, Typography } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { COMPANY_INFO } from '../../constants/siteData'
import { CONTACT_BAR_HEIGHT } from '../../constants/layout'

const itemSx = {
  flex: 1,
  minWidth: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: { xs: 0.75, md: 1.5 },
  px: { xs: 0.5, md: 2 },
  color: '#fff',
  textAlign: 'left',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
  '&:not(:first-of-type)': { borderLeft: '1px solid rgba(255,255,255,0.15)' },
}

const labelSx = { display: 'block', lineHeight: 1.2, color: 'rgba(255,255,255,0.65)', fontSize: { xs: '0.625rem', md: '0.75rem' } }
const valueSx = { display: 'block', lineHeight: 1.3, fontWeight: 700, fontSize: { xs: '0.75rem', md: '0.9375rem' }, whiteSpace: 'nowrap' }

// 화면 아래에 항상 고정되는 연락 바: 전화, 카카오톡, 입금계좌를 어디서나 바로 확인
const ContactBar = () => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(COMPANY_INFO.accountNumber)
      setIsCopied(true)
    } catch {
      // 복사 권한이 없는 환경: 번호는 화면에 그대로 보이므로 직접 선택해서 복사할 수 있음
    }
  }

  const handleSnackbarClose = () => {
    setIsCopied(false)
  }

  return (
    <>
      {/* 고정 바에 푸터가 가려지지 않도록 같은 높이의 여백 */}
      <Box sx={{ height: CONTACT_BAR_HEIGHT }} />

      <Box
        component="aside"
        aria-label="연락처 안내"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          height: CONTACT_BAR_HEIGHT,
          bgcolor: '#111',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ height: '100%', display: 'flex' }}>
          <ButtonBase component="a" href="tel:16449879" aria-label="대표전화 1644-9879 전화하기" sx={itemSx}>
            <PhoneIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 22 } }} />
            <Box>
              <Typography component="span" sx={labelSx}>
                대표전화
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}> · {COMPANY_INFO.hours.split(' (')[0]}</Box>
              </Typography>
              <Typography component="span" sx={valueSx}>
                {COMPANY_INFO.tel}
              </Typography>
            </Box>
          </ButtonBase>

          <ButtonBase aria-label="카카오톡 상담" sx={itemSx}>
            <ChatBubbleIcon sx={{ color: '#FEE500', fontSize: { xs: 18, md: 22 } }} />
            <Box>
              <Typography component="span" sx={labelSx}>
                카카오톡 상담
              </Typography>
              <Typography component="span" sx={valueSx}>
                {COMPANY_INFO.kakao}
              </Typography>
            </Box>
          </ButtonBase>

          <ButtonBase
            onClick={handleCopyAccount}
            aria-label={`입금계좌 ${COMPANY_INFO.bank} 복사하기`}
            sx={{ ...itemSx, flex: { xs: 1.5, md: 1 } }}
          >
            <AccountBalanceIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 22 } }} />
            <Box>
              {/* 모바일은 짧게(은행명 + 번호), 데스크톱은 예금주와 안내까지 */}
              <Typography component="span" sx={labelSx}>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  국민은행 · 누르면 복사
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  입금계좌 (예금주 {COMPANY_INFO.accountHolder}) · 누르면 복사
                </Box>
              </Typography>
              <Typography component="span" sx={valueSx}>
                <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
                  {COMPANY_INFO.accountNumber}
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  {COMPANY_INFO.bank}
                </Box>
              </Typography>
            </Box>
          </ButtonBase>
        </Container>
      </Box>

      <Snackbar
        open={isCopied}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: CONTACT_BAR_HEIGHT + 16, md: CONTACT_BAR_HEIGHT + 24 } }}
      >
        <Alert severity="success" variant="filled" onClose={handleSnackbarClose}>
          계좌번호가 복사되었습니다
        </Alert>
      </Snackbar>
    </>
  )
}

export default ContactBar
