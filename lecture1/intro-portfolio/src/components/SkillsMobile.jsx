import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useInView from '../hooks/useInView';
import { INK, POINT_LIME } from '../constants/colors';

// 세 번째 섹션의 모바일 화면 — 데스크톱 방사형 다이어그램 대신
// 큰 제목 + 번호 붙은 툴 목록 + "WHO AM I ?" 버튼(자기소개 페이지로 이동)을 위에서 아래로 보여 준다.
// 화면에 들어오면 목록이 위에서부터 한 줄씩 떠오른다.

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const LINE = 'rgba(17, 17, 17, 0.35)';
const MUTED = 'rgba(17, 17, 17, 0.6)';

const revealSx = (isInView, delay) => ({
  opacity: isInView ? 1 : 0,
  transform: isInView ? 'none' : 'translateY(16px)',
  transition: `opacity 0.7s ${EASE} ${delay}ms, transform 0.7s ${EASE} ${delay}ms`,
  '@media (prefers-reduced-motion: reduce)': { opacity: 1, transform: 'none', transition: 'none' },
});

const alumniSx = {
  fontFamily: '"Alumni Sans", sans-serif',
  fontWeight: 600,
  lineHeight: 1,
};

// 자격증 배지 — 데스크톱 다이어그램의 배지와 같은 모양
const certBadgeSx = {
  ...alumniSx,
  px: 1,
  py: 0.25,
  border: `1px solid ${MUTED}`,
  borderRadius: 999,
  fontSize: 12,
  letterSpacing: '0.04em',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

// skills: Skills.jsx의 SKILLS, aboutUrl·onAboutClick: WHO AM I ? 버튼이 여는 자기소개 페이지
// caption·captionSx: 위 왼쪽 작은 캡션과 그 글자 모양 (데스크톱 아래 캡션과 같다)
// countCaption: 툴·스킬 개수가 세어지며 올라가는 캡션 (Skills.jsx의 CountCaption)
const SkillsMobile = ({ skills, aboutUrl, onAboutClick, caption, countCaption, captionSx }) => {
  const [listRef, isInView] = useInView(0.1);

  const handleAboutClick = (event) => {
    event.preventDefault();
    onAboutClick();
  };

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      {/* 위 캡션 — 데스크톱 아래 모서리 캡션과 같은 글 */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={captionSx}>{caption}</Typography>
        {countCaption}
      </Stack>

      <Typography
        component="h2"
        sx={{
          mt: 2,
          fontFamily: '"Anton", sans-serif',
          fontWeight: 400,
          fontSize: 'clamp(48px, 15vw, 80px)',
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: INK,
        }}
      >
        SKILLS
        <br />
        &amp; TOOLS
      </Typography>

      {/* 툴 목록 — 번호 / 툴 이름·세부 스킬 / 자격증 배지 */}
      <Box ref={listRef} component="ol" sx={{ m: 0, mt: 5, p: 0, listStyle: 'none', borderBottom: `1px solid ${LINE}` }}>
        {skills.map((skill, index) => (
          <Box
            key={skill.title}
            component="li"
            sx={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto',
              alignItems: 'baseline',
              columnGap: 1,
              py: 2,
              borderTop: `1px solid ${LINE}`,
              ...revealSx(isInView, index * 70),
            }}
          >
            <Typography sx={{ ...alumniSx, fontSize: 13, color: MUTED }}>{String(index + 1).padStart(2, '0')}</Typography>
            <Box>
              <Typography component="h3" sx={{ ...alumniSx, fontSize: 28, letterSpacing: '-0.01em', color: INK }}>
                {skill.title}
              </Typography>
              <Typography sx={{ ...alumniSx, mt: 0.75, fontSize: 14, letterSpacing: '0.02em', color: MUTED }}>
                {skill.subs.map((sub) => sub.title).join(' · ')}
              </Typography>
            </Box>
            {skill.certs ? (
              <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                {skill.certs.map((cert) => (
                  <Box key={cert} component="span" sx={certBadgeSx}>
                    {cert}
                  </Box>
                ))}
              </Stack>
            ) : (
              <span />
            )}
          </Box>
        ))}
      </Box>

      {/* WHO AM I ? — 데스크톱 가운데 사각형의 모바일 버전. 누르면 자기소개 페이지로 넘어간다 */}
      <Box
        component="a"
        href={aboutUrl}
        onClick={handleAboutClick}
        aria-label="WHO AM I ? — 자기소개 페이지로 이동"
        sx={{
          mt: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2.25,
          bgcolor: '#000000',
          color: '#ffffff',
          textDecoration: 'none',
          '& .whoArrow': { transition: `transform 0.3s ${EASE}` },
          '&:active .whoArrow, &:hover .whoArrow': { transform: 'translateX(6px)' },
        }}
      >
        <Box aria-hidden sx={{ width: 12, height: 12, flexShrink: 0, bgcolor: POINT_LIME }} />
        <Typography sx={{ fontFamily: '"Anton", sans-serif', fontSize: 30, lineHeight: 1, letterSpacing: '-0.01em' }}>
          WHO AM I ?
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ ...alumniSx, fontSize: 16, letterSpacing: '0.04em' }}>ABOUT ME</Typography>
        <Box component="svg" className="whoArrow" viewBox="0 0 34 24" aria-hidden sx={{ width: 28, height: 20 }}>
          <path d="M0 12 H32 M21 1 L32 12 L21 23" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </Box>
      </Box>
    </Box>
  );
};

export default SkillsMobile;
