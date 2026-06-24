import { Box, Container, Typography, Button, IconButton, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import InstagramIcon from '@mui/icons-material/Instagram';
import Section from '../components/Section';

const BREAD_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M4 19c0-7.7 5.4-13 12-13s12 5.3 12 13c0 4.4-2.4 6.5-6.5 6.5h-11C6.4 25.5 4 23.4 4 19z' fill='%23E8AA5E' stroke='%23B8732E' stroke-width='2'/%3E%3Cpath d='M11 11l2 7M16 9l1 8M21 11l-2 7' stroke='%23B8732E' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\") 16 16, pointer";

function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero 섹션 */}
      <Box
        component="section"
        id="hero"
        sx={{
          py: { xs: 10, md: 14 },
          bgcolor: 'primary.main',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            여기는 Hero 섹션입니다
          </Typography>
          <Typography sx={{ opacity: 0.9, maxWidth: 560, mx: 'auto' }}>
            메인 비주얼, 이름, 간단 소개가 들어갈 예정입니다.
          </Typography>
        </Container>
      </Box>

      {/* About Me 섹션 */}
      <Section
        id="about-preview"
        title="여기는 About Me 섹션입니다"
        description="간단한 자기소개와 '더 알아보기' 버튼이 들어갈 예정입니다."
      >
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={() => navigate('/about')}
        >
          더 알아보기
        </Button>
      </Section>

      {/* Skill Tree 섹션 */}
      <Section
        id="skill-tree"
        title="여기는 Skill Tree 섹션입니다"
        description="기술 스택을 트리나 프로그레스바로 시각화할 예정입니다."
      />

      {/* Projects 섹션 */}
      <Section
        id="projects-preview"
        title="여기는 Projects 섹션입니다"
        description="대표작 썸네일 3-4개와 '더 보기' 버튼이 들어갈 예정입니다."
      >
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={() => navigate('/projects')}
        >
          더 보기
        </Button>
      </Section>

      {/* Contact 섹션 */}
      <Box
        id="contact"
        component="section"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'primary.main',
          borderTop: '1px solid',
          borderColor: 'divider',
          cursor: BREAD_CURSOR,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 700, color: '#FFFFFF' }}>
            🍞 편하게 말 걸어주세요!
          </Typography>
          <Typography sx={{ mb: 4, color: '#FFFFFF', opacity: 0.9, maxWidth: 480, mx: 'auto' }}>
            궁금한 점이나 같이 해보고 싶은 이야기가 있다면 언제든 편하게 연락주세요 :)
          </Typography>

          <Stack spacing={3} sx={{ alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<EmailIcon />}
              href="mailto:yrkim2605@gmail.com"
              sx={{
                bgcolor: '#FFFFFF',
                color: 'primary.main',
                borderRadius: 999,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                '&:hover': { bgcolor: '#FFF5EC' },
              }}
            >
              이메일 보내기
            </Button>

            <Stack direction="row" spacing={2}>
              <IconButton
                component="a"
                href="https://github.com/yrkim2605-wq"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: '#FFFFFF',
                  color: 'primary.main',
                  '&:hover': { bgcolor: '#FFF5EC' },
                }}
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: '#FFFFFF',
                  color: 'primary.main',
                  '&:hover': { bgcolor: '#FFF5EC' },
                }}
              >
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
