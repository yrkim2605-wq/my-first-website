import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import SectionHeading from '../components/common/SectionHeading'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { LEGAL_DOCUMENT_STATUS, LEGAL_INFO, LEGAL_VERSION, getPendingLegalKeys } from '../constants/legalInfo'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../constants/legalDocs'
import { parseLegalText } from '../utils/legalText'
import { DISPLAY_FONT, RADIUS } from '../theme'

// 한 문단을 조각대로 그려요. 운영자가 아직 정하지 않은 값은 노란 표시로 눈에 띄게 해요.
const LegalText = ({ text }) =>
  parseLegalText(text, LEGAL_INFO).map((piece, index) => {
    if (piece.type === 'bold') return <b key={index}>{piece.text}</b>
    if (piece.type === 'pending') {
      return (
        <Box key={index} component="mark" sx={{ bgcolor: '#ffe08a', color: 'text.primary', fontWeight: 800, px: 0.5, borderRadius: '4px' }}>
          {piece.text}
        </Box>
      )
    }
    return piece.text
  })

const BODY_SX = { fontSize: '0.92rem', lineHeight: 1.8, wordBreak: 'keep-all' }

// 개인정보처리방침 · 이용약관을 보여주는 화면 (같은 모양, 본문만 달라요)
const LegalDocument = ({ doc, eyebrow }) => {
  const pendingKeys = getPendingLegalKeys()
  const isDraft = LEGAL_DOCUMENT_STATUS === 'draft'

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 3, sm: 4.5 }, pb: { xs: 6, sm: 8 } }}>
        <SectionHeading variant="sign" eyebrow={eyebrow} title={doc.title} description={`문서 버전 ${LEGAL_VERSION}`} sx={{ mb: { xs: 2, sm: 3 } }} />

        {(isDraft || pendingKeys.length > 0) && (
          <Alert severity="warning" sx={{ mb: 2.5, wordBreak: 'keep-all' }}>
            이 문서는 <b>초안</b>이에요. 법률 전문가의 검토를 받기 전이라 내용이 바뀔 수 있어요.
            {pendingKeys.length > 0 && (
              <>
                {' '}
                노란색 <b>[확인 필요]</b> 항목은 운영자가 아직 정하지 않은 내용이라, 공개 전에 채워야 해요.
              </>
            )}
          </Alert>
        )}

        <Box component="article" sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: { xs: 2.5, sm: 4 } }}>
          <Typography sx={{ ...BODY_SX, mb: 3 }}>
            <LegalText text={doc.intro} />
          </Typography>

          {doc.sections.map((section) => (
            <Box component="section" key={section.title} sx={{ mb: 3, '&:last-of-type': { mb: 0 } }}>
              <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.1rem', color: 'primary.main', mb: 1 }}>
                <LegalText text={section.title} />
              </Typography>
              {section.body.map((block, index) =>
                typeof block === 'string' ? (
                  <Typography key={index} sx={{ ...BODY_SX, mb: 1 }}>
                    <LegalText text={block} />
                  </Typography>
                ) : (
                  <Box key={index} component="ul" sx={{ ...BODY_SX, m: 0, mb: 1, pl: 2.5 }}>
                    {block.list.map((item) => (
                      <li key={item}>
                        <LegalText text={item} />
                      </li>
                    ))}
                  </Box>
                ),
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  )
}

export const PrivacyPolicyPage = () => <LegalDocument doc={PRIVACY_POLICY} eyebrow="PRIVACY POLICY" />
export const TermsOfServicePage = () => <LegalDocument doc={TERMS_OF_SERVICE} eyebrow="TERMS OF SERVICE" />
