import { Box, Container, Typography } from '@mui/material'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { COMPANY_INFO, FOOTER_LINKS, NOTICES } from '../../constants/siteData'
import SocialLinks from './SocialLinks'
import logo from '../../assets/logo.png'

const LINE_COLOR = '#E0E2E6'
const LOGO_HEIGHT = 40 // 왼쪽 로고 높이 = 가운데·오른쪽 칸 제목 높이 (본문 시작 높이를 맞추기 위함)
const COLUMN_GAP = 40 // 2줄, 3줄이 같은 간격을 써서 세로 구분선과 칸 사이가 일치

// 라벨 + 값 한 줄
const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.25 }}>
    <Typography variant="body2" sx={{ width: 104, flexShrink: 0, fontWeight: 500, lineHeight: 1.7 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, wordBreak: 'keep-all' }}>
      {value}
    </Typography>
  </Box>
)

// 칸 제목: 아래에 짧은 오렌지 선. 높이를 로고와 같게 해서 아래 본문이 같은 줄에서 시작
const BlockTitle = ({ children }) => (
  <Box sx={{ height: LOGO_HEIGHT, mb: 2 }}>
    <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.5 }}>{children}</Typography>
    <Box sx={{ width: 28, height: 3, bgcolor: 'primary.main', mt: 0.75 }} />
  </Box>
)

// 기존 덕명눈솔 사이트의 푸터 구조: 링크 / 전화·상담시간·SNS / 회사 정보·입금계좌·공지사항
const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#F5F6F8', pt: 4, pb: 5 }}>
      <Container maxWidth="lg">
        {/* 1줄: 링크 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 }, mb: 2.5 }}>
          {FOOTER_LINKS.map((link) => (
            <Typography key={link} variant="body2" sx={{ fontWeight: 500, cursor: 'pointer' }}>
              {link}
            </Typography>
          ))}
        </Box>

        {/* 2줄: 대표전화 | 상담시간 | SNS (칸마다 위아래 선) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            columnGap: { md: `${COLUMN_GAP}px` },
            '& > *': { minHeight: 88, borderTop: `1px solid ${LINE_COLOR}`, borderBottom: `1px solid ${LINE_COLOR}` },
            // 모바일(세로 쌓임): 칸 사이 선이 겹치지 않게 아래 선은 마지막 칸에만
            '& > *:not(:last-child)': { borderBottom: { xs: 'none', md: `1px solid ${LINE_COLOR}` } },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HeadsetMicOutlinedIcon sx={{ fontSize: 40, color: '#555' }} />
            <Typography component="a" href="tel:16449879" sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>
              {COMPANY_INFO.tel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 40, color: '#555' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.6 }}>상담시간 {COMPANY_INFO.hours}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                휴무 {COMPANY_INFO.holiday}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {COMPANY_INFO.delivery}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, py: { xs: 2, md: 0 } }}>
            <SocialLinks />
          </Box>
        </Box>

        {/* 3줄: 회사 정보 | 입금계좌 안내 | 공지사항 (2줄과 같은 3등분, 세로 구분선은 칸 사이 간격의 가운데) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            columnGap: { md: `${COLUMN_GAP}px` },
            pt: 3,
            '& > *': { position: 'relative', py: { xs: 2, md: 0 } },
            '& > *:not(:first-of-type)::before': {
              content: '""',
              display: { xs: 'none', md: 'block' },
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `-${COLUMN_GAP / 2}px`,
              width: '1px',
              bgcolor: LINE_COLOR,
            },
          }}
        >
          <Box>
            <Box component="img" src={logo} alt="DMNS 덕명눈솔" sx={{ display: 'block', height: LOGO_HEIGHT, mb: 2 }} />
            <Typography sx={{ fontWeight: 700, lineHeight: 1.7, mb: 0.5 }}>{COMPANY_INFO.name}</Typography>
            <InfoRow label="대표" value={COMPANY_INFO.ceo} />
            <InfoRow label="사업자등록번호" value={COMPANY_INFO.businessNumber} />
            <InfoRow label="통신판매업" value={COMPANY_INFO.salesNumber} />
            <InfoRow label="주소" value={COMPANY_INFO.address} />
            <InfoRow label="E-mail" value={COMPANY_INFO.email} />
            <InfoRow label="T / F" value={`${COMPANY_INFO.tel}  |  ${COMPANY_INFO.fax}`} />
          </Box>

          <Box>
            <BlockTitle>입금계좌 안내</BlockTitle>
            <Typography sx={{ fontWeight: 700, lineHeight: 1.7, mb: 0.5, wordBreak: 'keep-all' }}>
              {COMPANY_INFO.bank}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, py: 0.25 }}>
              예금주 {COMPANY_INFO.accountHolder}
            </Typography>
          </Box>

          <Box id="notices" sx={{ scrollMarginTop: 80 }}>
            <BlockTitle>공지사항</BlockTitle>
            {NOTICES.map((notice) => (
              <Box key={notice.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.25 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.7, wordBreak: 'keep-all' }}>
                  ■ {notice.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', lineHeight: 2.4 }}>
                  {notice.date}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'text.secondary' }}>
          리디자인 포트폴리오 작업물입니다. 상품 이미지는 플레이스홀더로 대체되었습니다.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
