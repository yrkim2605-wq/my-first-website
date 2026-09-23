import { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Stack, Chip, Avatar, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AvatarFallbackGraphic from '../components/AvatarFallbackGraphic';
import Hero from '../components/Hero';
import ScrollReveal from '../components/ScrollReveal';
import ScrollRevealStatement from '../components/ScrollRevealStatement';
import StatsSection from '../components/StatsSection';
import Section from '../components/Section';
import ContactInfo from '../components/contact/ContactInfo';
import Guestbook from '../components/contact/Guestbook';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectCardSkeleton from '../components/projects/ProjectCardSkeleton';
import SkillIconBadge from '../components/skills/SkillIconBadge';
import { supabase } from '../lib/supabaseClient';
import { usePortfolio } from '../context/PortfolioContext';

function Home() {
  const navigate = useNavigate();
  const { getHomeData, skills } = usePortfolio();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const homeData = getHomeData();
  const devStory = homeData.content.find((section) => section.id === 'dev-story') ?? homeData.content[0];

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToIntroStatement = () => {
    document.getElementById('intro-statement')?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <Hero
        onExploreProjects={() => navigate('/projects')}
        onContact={scrollToContact}
        onScrollNext={scrollToIntroStatement}
      />

      {/* 스크롤 유도 스테이트먼트 (이미지 배경 + 패럴렉스) */}
      <ScrollRevealStatement id="intro-statement" text="정보와 사람을 잇는 디자인" />

      {/* About Me 섹션 */}
      <Section id="about-preview" title={`안녕하세요, ${homeData.basicInfo.name}입니다`}>
        <ScrollReveal direction="up" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              alignItems: 'stretch',
              justifyContent: 'center',
              mb: 4,
              width: '100%',
              maxWidth: 720,
              mx: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {/* 나의 디자인 스토리 (왼쪽) */}
            {devStory && (
              <Fade in key={devStory.summary} timeout={500}>
                <Box
                  sx={{
                    flex: 2,
                    p: { xs: 4, sm: 5 },
                    textAlign: { xs: 'center', sm: 'left' },
                    borderTop: { xs: '1px solid', sm: 'none' },
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {devStory.title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                    {devStory.summary}
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* 구분선 */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '1px', bgcolor: 'divider' }} />

            {/* 프로필 사진 + 이름 (오른쪽) */}
            <Box
              sx={{
                flex: 1,
                flexShrink: 0,
                textAlign: 'center',
                p: { xs: 4, sm: 5 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                src={homeData.basicInfo.photo || undefined}
                alt={homeData.basicInfo.name}
                slotProps={{ img: { loading: 'lazy' } }}
                sx={{
                  width: 88,
                  height: 88,
                  mb: 1.5,
                  mx: 'auto',
                  background: 'linear-gradient(135deg, #7C6BFF 0%, #4F3CF2 100%)',
                }}
              >
                {!homeData.basicInfo.photo && <AvatarFallbackGraphic size={50} />}
              </Avatar>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{homeData.basicInfo.name}</Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
              >
                <Chip label={homeData.basicInfo.education} variant="outlined" color="primary" size="small" />
                <Chip label={homeData.basicInfo.major} variant="outlined" color="primary" size="small" />
                <Chip label={homeData.basicInfo.experience} color="primary" size="small" />
              </Stack>
            </Box>
          </Box>

          <Fade in key={homeData.skills.map((skill) => `${skill.id}:${skill.level}`).join(',')} timeout={500}>
            <Stack
              direction="row"
              spacing={3}
              useFlexGap
              sx={{ flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}
            >
              {homeData.skills.map((skill) => (
                <SkillIconBadge key={skill.id} skill={skill} />
              ))}
            </Stack>
          </Fade>

          <Button variant="contained" color="primary" onClick={() => navigate('/about')}>
            더 알아보기
          </Button>
        </ScrollReveal>
      </Section>

      {/* 통계 카운터 섹션 */}
      <StatsSection
        stats={[
          { label: '완료 프로젝트', value: projects.length, suffix: '개' },
          { label: '보유 기술', value: skills.length, suffix: '개' },
          { label: '보유 자격증', value: homeData.basicInfo.certifications?.length ?? 0, suffix: '개' },
        ]}
      />

      {/* Skills 섹션 */}
      <Section id="skills-preview" title="Skills">
        <ScrollReveal direction="up">
          <Fade in key={homeData.skills.map((skill) => `${skill.id}:${skill.level}`).join(',')} timeout={500}>
            <Stack
              direction="row"
              spacing={3}
              useFlexGap
              sx={{ mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {homeData.skills.map((skill) => (
                <SkillIconBadge key={skill.id} skill={skill} />
              ))}
            </Stack>
          </Fade>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mt: 4 }}
            onClick={() => navigate('/about')}
          >
            전체 스킬 보기
          </Button>
        </ScrollReveal>
      </Section>

      {/* Projects 섹션 */}
      <Box
        id="projects-preview"
        component="section"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <ScrollReveal direction="up">
            <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
              Projects
            </Typography>
            <Typography sx={{ mb: 5, color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
              직접 기획하고 개발한 프로젝트들을 소개합니다.
            </Typography>
          </ScrollReveal>

          {loadingProjects ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 4,
                textAlign: 'left',
              }}
            >
              {Array.from({ length: 2 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
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
              {projects.map((project, index) => (
                <ScrollReveal key={project.id} direction="up" delay={index * 0.12} threshold={0.15}>
                  <ProjectCard project={project} />
                </ScrollReveal>
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
          <ScrollReveal direction="up">
            <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 700, color: '#FFFFFF' }}>
              Contact
            </Typography>
            <Typography sx={{ mb: 4, color: '#FFFFFF', opacity: 0.9, maxWidth: 480, mx: 'auto' }}>
              협업 제안이나 문의사항이 있다면 언제든 편하게 연락 주세요.
            </Typography>

            <ContactInfo />
          </ScrollReveal>
        </Container>
      </Box>

      {/* 방명록 섹션 (Contact 섹션 하단) */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <ScrollReveal direction="up">
            <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
              Guestbook
            </Typography>
            <Guestbook />
          </ScrollReveal>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
