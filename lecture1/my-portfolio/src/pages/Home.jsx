import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Section from '../components/Section';

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
      <Section
        id="contact"
        title="여기는 Contact 섹션입니다"
        description="연락처, SNS, 간단한 메시지 폼이 들어갈 예정입니다."
        accent
      />
    </Box>
  );
}

export default Home;
