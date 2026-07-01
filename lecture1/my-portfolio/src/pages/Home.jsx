import { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Section from '../components/Section';
import ContactInfo from '../components/contact/ContactInfo';
import Guestbook from '../components/contact/Guestbook';
import ProjectCard from '../components/projects/ProjectCard';
import { supabase } from '../lib/supabaseClient';

function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setProjects(data ?? []);
      setLoadingProjects(false);
    };
    loadProjects();
  }, []);

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
      <Box
        id="projects-preview"
        component="section"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
            Projects
          </Typography>
          <Typography sx={{ mb: 5, color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
            직접 기획하고 개발한 프로젝트들을 소개합니다.
          </Typography>

          {loadingProjects ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 4,
                textAlign: 'left',
              }}
            >
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 5 }}
            onClick={() => navigate('/projects')}
          >
            더 보기
          </Button>
        </Container>
      </Box>

      {/* Contact 섹션 */}
      <Box
        id="contact"
        component="section"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'primary.main',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 700, color: '#FFFFFF' }}>
            🍞 편하게 말 걸어주세요!
          </Typography>
          <Typography sx={{ mb: 4, color: '#FFFFFF', opacity: 0.9, maxWidth: 480, mx: 'auto' }}>
            궁금한 점이나 같이 해보고 싶은 이야기가 있다면 언제든 편하게 연락주세요 :)
          </Typography>

          <ContactInfo />
        </Container>
      </Box>

      {/* 방명록 섹션 (Contact 섹션 하단) */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
            📝 방명록
          </Typography>
          <Guestbook />
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
