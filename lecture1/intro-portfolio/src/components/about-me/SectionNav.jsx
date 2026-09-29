import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { dpx } from '../../constants/typography';
import { ABOUT_SECTIONS, aboutTextSx } from './aboutMeStyles';

// 오른쪽 세로 진행 표시 + 오른쪽 아래 Scroll 화살표
// 섹션마다 같은 자리에 그려서 화면에 붙어 있는 것처럼 보이게 하고, 지금 섹션(activeIndex)만 밝게 표시한다.
// 점을 누르면 그 섹션으로, 화살표를 누르면 다음 섹션으로 부드럽게 이동한다 (useSmoothScroll의 앵커 이동)
// sections·label: 다른 페이지(예: 프로젝트 상세)에서 쓸 때 그 페이지의 섹션 목록과 이름을 넘긴다
const SectionNav = ({ activeIndex, sections = ABOUT_SECTIONS, label = '자기소개 섹션' }) => {
  const next = sections[activeIndex + 1]?.isReady ? sections[activeIndex + 1] : null;

  return (
    <>
      <Box
        component="nav"
        aria-label={label}
        sx={{
          position: 'absolute',
          left: dpx(1389),
          top: dpx(185),
          height: dpx(158),
          width: '1px',
          bgcolor: 'rgba(255, 255, 255, 0.25)',
        }}
      >
        {sections.map((section, index) => {
          const isActive = index === activeIndex;
          return (
            <Stack
              key={section.id}
              component={section.isReady ? 'a' : 'span'}
              href={section.isReady ? `#${section.id}` : undefined}
              aria-current={isActive ? 'true' : undefined}
              direction="row"
              sx={{
                position: 'absolute',
                top: dpx(52 + index * 34),
                left: 0,
                alignItems: 'center',
                transform: 'translate(-50%, -50%)',
                p: dpx(4),
                textDecoration: 'none',
                '&:hover .navDot, &:hover .navLabel': { opacity: 1 },
              }}
            >
              <Box
                className="navDot"
                sx={{
                  width: dpx(isActive ? 6 : 3),
                  height: dpx(isActive ? 6 : 3),
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              />
              <Typography
                className="navLabel"
                sx={{
                  ...aboutTextSx,
                  position: 'absolute',
                  left: dpx(14),
                  fontWeight: 400,
                  fontSize: dpx(11),
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                {section.label}
              </Typography>
            </Stack>
          );
        })}
      </Box>

      <Stack
        component={next ? 'a' : 'div'}
        href={next ? `#${next.id}` : undefined}
        aria-label={next ? `${next.label} 섹션으로 이동` : undefined}
        sx={{
          position: 'absolute',
          left: dpx(1386),
          top: dpx(699),
          alignItems: 'center',
          transform: 'translateX(-50%)',
          color: '#ffffff',
          textDecoration: 'none',
          // 검정 배경에서도 테두리로 또렷하고, 사진 위에서도 흐림 효과로 도드라지는 유리판 (BACK 버튼과 짝을 이룬다)
          px: dpx(14),
          py: dpx(10),
          borderRadius: dpx(999),
          bgcolor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(8px)',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
          '&:hover, &:focus-visible': { bgcolor: 'rgba(255, 255, 255, 0.24)', borderColor: 'rgba(255, 255, 255, 0.7)' },
        }}
      >
        <Typography sx={{ ...aboutTextSx, fontWeight: 400, fontSize: dpx(12) }}>Scroll</Typography>
        <Box
          component="svg"
          viewBox="0 0 24 34"
          aria-hidden
          sx={{
            mt: dpx(10),
            width: dpx(24),
            height: dpx(34),
            // floatSmall: 창 아래로 밀려나지 않도록, 원래 float보다 적게 움직이는 전용 버전을 쓴다
            animation: 'floatSmall 2.4s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <path d="M12 0 V32 M1 21 L12 32 L23 21" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        </Box>
      </Stack>
    </>
  );
};

export default SectionNav;
