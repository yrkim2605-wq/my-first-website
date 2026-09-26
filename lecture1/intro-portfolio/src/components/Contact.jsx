import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import FitStage from './FitStage';

const MAIL = 'melon0503@naver.com';
const TEL = '010.7221.2605';
const GITHUB_URL = 'https://github.com/';

const footerTextSx = {
  fontFamily: '"Alumni Sans", sans-serif',
  fontWeight: 600,
  fontSize: { xs: 15, md: dpx(16) },
  letterSpacing: '-0.02em',
  lineHeight: 1,
  color: '#111111',
  textDecoration: 'none',
};

const FooterLink = ({ href, children, ...props }) => (
  <Typography
    component="a"
    href={href}
    {...props}
    sx={{
      ...footerTextSx,
      position: 'relative',
      // 마우스를 올리면 밑줄이 왼쪽에서부터 그어진다
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '-0.2em',
        height: '1px',
        bgcolor: 'currentColor',
        transform: 'scaleX(0)',
        transformOrigin: 'right',
        transition: 'transform 0.35s ease',
      },
      '&:hover::after, &:focus-visible::after': { transform: 'scaleX(1)', transformOrigin: 'left' },
    }}
  >
    {children}
  </Typography>
);

const Contact = () => {
  return (
    <FitStage
      id="contact"
      ratio={[2000, 863]}
      sx={{ bgcolor: '#ffffff', color: '#111111' }}
      stageSx={{ pt: { xs: '20vw', md: '6.55cqw' }, pb: { xs: 4, md: 0 } }}
    >
      <Stack sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '24vw', md: dpx(150) },
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          CONTACT
        </Typography>

        <Typography
          sx={{
            mt: { xs: 2, md: '1cqw' },
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: { xs: 20, md: dpx(25) },
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          LET&apos;S TURN IDEAS INTO EXPERIENCE.
        </Typography>
        <Typography
          sx={{
            mt: { xs: 0.5, md: '0.3cqw' },
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: { xs: 13, md: dpx(12) },
            letterSpacing: '-0.02em',
          }}
        >
          새로운 아이디어와 협업의 기회를 기다리고 있습니다.
        </Typography>

        <Stack
          component="a"
          href={`mailto:${MAIL}`}
          direction="row"
          sx={{
            mt: { xs: 5, md: '2.65cqw' },
            alignItems: 'center',
            gap: { xs: 1.5, md: '0.6cqw' },
            pl: { xs: 2, md: '0.9cqw' },
            pr: { xs: 1.5, md: '0.6cqw' },
            height: { xs: 52, md: '2.9cqw' },
            bgcolor: '#000000',
            color: '#ffffff',
            textDecoration: 'none',
            position: 'relative',
            overflow: 'hidden',
            // 마우스를 올리면 빛줄기가 버튼을 비스듬히 스쳐 지나간다 (참고: dayonedream.com 푸터 링크)
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '-60%',
              width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none',
            },
            '&:hover::before, &:focus-visible::before': { animation: 'shimmer 0.8s ease forwards' },
            '& svg': { transition: 'transform 0.3s ease' },
            '&:hover svg': { transform: 'translateX(0.3em)' },
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Alumni Sans", sans-serif',
              fontWeight: 600,
              fontSize: { xs: 30, md: dpx(35) },
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            CONTACT
          </Typography>
          <ArrowForwardIosRoundedIcon sx={{ fontSize: { xs: 22, md: '1.5cqw' } }} />
        </Stack>
      </Stack>

      {/* 푸터 정보 */}
      <Box
        component="footer"
        sx={{
          position: { xs: 'static', md: 'absolute' },
          left: '1.95cqw',
          right: '1.65cqw',
          top: '36.6cqw',
          mt: { xs: 10, md: 0 },
          px: { xs: 3, md: 0 },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack spacing={{ xs: 1.5, md: '0.55cqw' }}>
            <Typography sx={footerTextSx}>CONTACT ME</Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 1.5, md: 0 }}
              sx={{ gap: { md: '8.3cqw' } }}
            >
              <Stack direction="row" sx={{ gap: { xs: 1, md: '0.6cqw' } }}>
                <Typography sx={footerTextSx}>MAIL :</Typography>
                <FooterLink href={`mailto:${MAIL}`}>{MAIL}</FooterLink>
              </Stack>
              <Stack direction="row" sx={{ gap: { xs: 1, md: '0.7cqw' } }}>
                <Typography sx={footerTextSx}>TEL :</Typography>
                <FooterLink href={`tel:${TEL.replaceAll('.', '')}`}>{TEL}</FooterLink>
              </Stack>
            </Stack>
          </Stack>

          <Stack spacing={{ xs: 1.5, md: '0.45cqw' }}>
            <Typography sx={footerTextSx}>LINK</Typography>
            <FooterLink href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </FooterLink>
          </Stack>
        </Stack>

        <Typography sx={{ ...footerTextSx, mt: { xs: 4, md: '2.3cqw' } }}>
          © 2026 KIM YURI. ALL RIGHTS RESERVED.
        </Typography>
      </Box>
    </FitStage>
  );
};

export default Contact;
