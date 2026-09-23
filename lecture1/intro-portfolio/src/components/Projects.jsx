import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const PROJECTS = [
  {
    title: 'DR.JART+ WEBSITE REDESIGN',
    body: '더마 코스메틱 브랜드 Dr.Jart+의 웹사이트를 리디자인한 프로젝트',
    gradient: 'linear-gradient(135deg, #f5f5f5 0%, #cfcfcf 100%)',
    dark: false,
  },
  {
    title: 'AI INFLUENCER PROJECT X SIWOOENT',
    body: 'AI 인플루언서를 기획하여 이미지 및 영상을 제작하여 시우이엔티 기업 인스타그램 운영 및 이커머스 판매',
    gradient: 'linear-gradient(135deg, #2b2b2b 0%, #050505 100%)',
    dark: true,
  },
  {
    title: 'ILLUSTRATION ARCHIVE',
    body: 'CLIP STUDIO 를 활용해 다양한 캐릭터와 비주얼 스타일 제작',
    gradient: 'linear-gradient(135deg, #efe9d8 0%, #cfc6a5 100%)',
    dark: false,
  },
];

const Projects = () => {
  return (
    <Box
      id="projects"
      sx={{
        bgcolor: '#000000',
        color: '#ffffff',
        px: { xs: 3, md: 6 },
        py: { xs: 8, md: 14 },
      }}
    >
      <Stack spacing={2} sx={{ mb: { xs: 6, md: 10 } }}>
        <Typography
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '12vw', sm: 44, md: 'clamp(36px, 5vw, 65px)' },
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          SELECTED PROJECTS
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: { xs: 16, md: 20 },
            color: '#949494',
          }}
        >
          TURNING IDEAS INTO VISUAL EXPERIENCES ACROSS DESIGN, WEB AND AI
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            fontSize: 14,
            color: '#949494',
          }}
        >
          아이디어를 다양한 방식으로 탐구하고 시각적 경험으로 구현한 프로젝트 입니다.
        </Typography>
      </Stack>

      <Stack spacing={{ xs: 8, md: 12 }}>
        {PROJECTS.map((project) => (
          <Stack key={project.title} spacing={2}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: { xs: '4 / 3', md: '21 / 9' },
                background: project.gradient,
                borderRadius: 1,
                position: 'relative',
                cursor: 'pointer',
                '&:hover .click-hint': { opacity: 1 },
              }}
            >
              <Typography
                className="click-hint"
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  fontFamily: '"Alumni Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  color: project.dark ? '#ffffff' : '#111111',
                  opacity: { xs: 1, md: 0.6 },
                  transition: 'opacity 0.2s ease',
                }}
              >
                Click →
              </Typography>
            </Box>

            <Stack spacing={0.75}>
              <Typography
                sx={{
                  fontFamily: '"Alumni Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: { xs: 20, md: 25 },
                  letterSpacing: '-0.02em',
                }}
              >
                {project.title}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#949494',
                  maxWidth: 560,
                }}
              >
                {project.body}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default Projects;
