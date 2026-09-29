import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FitStage from '../FitStage';
import SectionNav from '../about-me/SectionNav';
import useInView from '../../hooks/useInView';
import { dpx } from '../../constants/typography';
import { aboutKoreanSx, aboutStageProps, aboutTextSx } from '../about-me/aboutMeStyles';

// 프로젝트 상세 02 화면 — 01 아래로 스크롤하면 01을 덮으며 올라온다 (1440 × 784 기준)
// 화면에 들어오면 세로선이 그어지고, 제목·설명·목록이 차례로 올라온 뒤 오른쪽 이미지가 드러난다.
// 글·이미지는 project.gallery(projectDetails.js)에서 받는다.

const IMAGE = { right: 1343, top: 60, height: 664 };
const LIST_ROW = 34; // 목록 한 줄 높이

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// 화면에 들어오기 전엔 아래로 살짝 내려가 숨어 있다가 delay(ms) 뒤에 올라온다
const revealSx = (isInView, delay) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'none' : `translateY(${dpx(24)})`,
  transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
});

const ProjectDetailGallery = ({ project }) => {
  const [ref, isInView] = useInView();
  const { sections, gallery } = project;
  const [w, h] = gallery.image.aspect.split('/').map(Number);
  const imageWidth = (IMAGE.height * w) / h;

  return (
    <FitStage id={sections[1].id} ref={ref} {...aboutStageProps}>
      {/* 왼쪽 번호 + 세로 구분선 */}
      <Box sx={{ position: 'absolute', left: dpx(62), top: dpx(108), ...revealSx(isInView, 0) }}>
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(52), letterSpacing: '-0.02em' }}>
          {sections[1].label}
        </Typography>
        <Typography sx={{ ...aboutTextSx, mt: dpx(16), fontSize: dpx(22), letterSpacing: '-0.01em' }}>
          {gallery.label}
        </Typography>
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: dpx(237),
          top: dpx(95),
          height: dpx(617),
          width: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          transformOrigin: 'top',
          transform: isInView ? 'scaleY(1)' : 'scaleY(0)',
          transition: `transform 1.2s ${EASE}`,
          '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
        }}
      />

      {/* 큰 제목 — 한 줄씩 올라온다 */}
      <Typography
        component="h2"
        sx={{
          ...aboutTextSx,
          position: 'absolute',
          left: dpx(300),
          top: dpx(132),
          fontSize: dpx(72),
          lineHeight: 1.02,
          letterSpacing: '-0.01em',
        }}
      >
        {gallery.heading.map((line, index) => (
          <Box key={line} component="span" sx={{ display: 'block', ...revealSx(isInView, 100 + index * 120) }}>
            {line}
          </Box>
        ))}
      </Typography>

      {/* 설명 — maxWidth로 오른쪽 이미지와 겹치지 않게 자동 줄바꿈한다 */}
      <Typography
        sx={{
          ...aboutKoreanSx,
          position: 'absolute',
          left: dpx(300),
          top: dpx(312),
          maxWidth: dpx(360),
          fontWeight: 400,
          fontSize: dpx(15),
          lineHeight: 1.5,
          color: '#a3a3a3',
          ...revealSx(isInView, 400),
        }}
      >
        {gallery.description.map((line) => (
          <Box key={line} component="span" sx={{ display: 'block' }}>
            {line}
          </Box>
        ))}
      </Typography>

      {/* 룩 목록 — 두 줄로 나눠 번호와 함께 차례로 올라온다 */}
      <Box
        component="ol"
        sx={{
          position: 'absolute',
          left: dpx(300),
          top: dpx(440),
          m: 0,
          p: 0,
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: `${dpx(170)} ${dpx(170)}`,
          gridAutoFlow: 'column', // 위에서 아래로 채운 뒤 다음 줄로
          gridTemplateRows: `repeat(${Math.ceil(gallery.items.length / 2)}, ${dpx(LIST_ROW)})`,
        }}
      >
        {gallery.items.map((item, index) => (
          <Box
            key={item}
            component="li"
            sx={{ display: 'flex', alignItems: 'baseline', gap: dpx(14), ...revealSx(isInView, 550 + index * 70) }}
          >
            <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(14), color: '#a3a3a3' }}>
              {String(index + 1).padStart(2, '0')}
            </Typography>
            <Typography sx={{ ...aboutKoreanSx, fontWeight: 600, fontSize: dpx(14), color: '#ffffff' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 오른쪽 이미지 — 위에서 아래로 걷히듯 드러난다 */}
      <Box
        component="img"
        src={gallery.image.src}
        alt={gallery.image.alt}
        sx={{
          position: 'absolute',
          left: dpx(IMAGE.right - imageWidth),
          top: dpx(IMAGE.top),
          width: dpx(imageWidth),
          aspectRatio: gallery.image.aspect,
          display: 'block',
          boxShadow: `0 ${dpx(22)} ${dpx(50)} rgba(0, 0, 0, 0.55)`,
          clipPath: isInView ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          transition: `clip-path 1.4s ${EASE} 300ms`,
          '@media (prefers-reduced-motion: reduce)': { clipPath: 'none', transition: 'none' },
        }}
      />

      <SectionNav activeIndex={1} sections={sections} label="프로젝트 상세 섹션" />
    </FitStage>
  );
};

export default ProjectDetailGallery;
