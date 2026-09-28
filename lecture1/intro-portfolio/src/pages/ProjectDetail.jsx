import Box from '@mui/material/Box';
import Header from '../components/Header';
import BackButton from '../components/about-me/BackButton';
import ProjectDetailIntro from '../components/project-detail/ProjectDetailIntro';
import useSmoothScroll from '../hooks/useSmoothScroll';

// 프로젝트 상세 페이지 — 메인 네 번째 섹션의 카드(썸네일·CLICK)를 누르면 열린다
// project: projectDetails.js의 한 항목 (프로젝트마다 진입점에서 넘겨준다)

const HOME_URL = import.meta.env.BASE_URL;

const ProjectDetail = ({ project }) => {
  useSmoothScroll();

  return (
    <Box sx={{ bgcolor: '#000000', minHeight: '100svh' }}>
      {/* 헤더를 띄워 두어 무대가 화면 맨 위부터 시작하게 한다 */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <Header linkPrefix={HOME_URL} />
      </Box>

      <BackButton section="projects" />

      <Box id={project.sections[0].id}>
        <ProjectDetailIntro project={project} />
      </Box>
    </Box>
  );
};

export default ProjectDetail;
