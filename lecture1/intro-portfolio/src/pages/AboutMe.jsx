import Box from '@mui/material/Box';
import Header from '../components/Header';
import AboutIntro from '../components/about-me/AboutIntro';
import AboutStory from '../components/about-me/AboutStory';
import AboutCertifications from '../components/about-me/AboutCertifications';
import SceneFade from '../components/about-me/SceneFade';
import BackButton from '../components/about-me/BackButton';
import { ABOUT_SECTIONS } from '../components/about-me/aboutMeStyles';
import SiteEffects from '../components/SiteEffects';
import EdgeNav, { PAGE_LINKS } from '../components/EdgeNav';
import useSmoothScroll from '../hooks/useSmoothScroll';

// 자기소개 페이지 — 세 번째 섹션의 "WHO AM I ?" 사각형을 누르면 열린다
// 01 About Me → 02 My Story → 03 Certifications 순서로 스크롤해 내려간다.
// 앞 섹션은 화면에 붙은 채 뒤로 물러나고, 다음 섹션이 그 위를 덮으며 올라와 화면이 자연스럽게 바뀐다.

const HOME_URL = import.meta.env.BASE_URL;

const AboutMe = () => {
  useSmoothScroll();

  return (
    <Box sx={{ bgcolor: '#000000', minHeight: '100svh' }}>
      {/* 헤더를 띄워 두어 무대가 화면 맨 위부터 시작하게 한다 */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <Header linkPrefix={HOME_URL} />
      </Box>

      <BackButton />
      <EdgeNav prev={PAGE_LINKS.main} next={PAGE_LINKS.ai} />
      <SiteEffects />

      <SceneFade id={ABOUT_SECTIONS[0].id}>
        <AboutIntro />
      </SceneFade>
      {/* 02의 sticky가 03이 올라오는 동안에도 붙어 있으려면, 02와 03이 같은 부모 안에 있어야 한다 */}
      <Box sx={{ position: 'relative', zIndex: 1, bgcolor: '#000000' }}>
        <SceneFade id={ABOUT_SECTIONS[1].id}>
          <AboutStory />
        </SceneFade>
        <Box sx={{ position: 'relative', zIndex: 1, bgcolor: '#000000' }}>
          <AboutCertifications id={ABOUT_SECTIONS[2].id} sectionIndex={2} />
        </Box>
      </Box>
    </Box>
  );
};

export default AboutMe;
