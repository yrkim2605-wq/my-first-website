import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const SKILLS = [
  { title: 'PHOTOSHOP', subs: ['RETOUCHING', 'IMAGE EDITING'] },
  { title: 'ILLUSTRATOR', subs: ['LOGO', 'SHORT-FORM VIDEO EDITING'] },
  { title: 'FIGMA', subs: ['AUTO LAYOUT', 'RESPONSIVE WEB', 'INTERACTION'] },
  { title: 'HTML/CSS/JS', subs: ['CODING'] },
  { title: 'CLAUDE', subs: ['IDEATION'] },
  { title: 'SEEDANCE', subs: ['AI VIDEO CREATION'] },
  { title: 'CAPCUT', subs: ['CONTENT'] },
];

const DIAGRAM_SIZE = 640;
const RADIUS = 260;

const nodePosition = (index, total) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const x = DIAGRAM_SIZE / 2 + RADIUS * Math.cos(angle);
  const y = DIAGRAM_SIZE / 2 + RADIUS * Math.sin(angle);
  return { x, y, angle };
};

const Skills = () => {
  return (
    <Box
      sx={{
        bgcolor: '#e4e4e4',
        color: '#111111',
        px: { xs: 3, md: 6 },
        py: { xs: 8, md: 14 },
      }}
    >
      {/* Desktop radial diagram */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: DIAGRAM_SIZE,
            height: DIAGRAM_SIZE,
            maxWidth: '100%',
          }}
        >
          <svg
            width={DIAGRAM_SIZE}
            height={DIAGRAM_SIZE}
            style={{ position: 'absolute', inset: 0 }}
          >
            {SKILLS.map((skill, i) => {
              const { x, y } = nodePosition(i, SKILLS.length);
              return (
                <line
                  key={skill.title}
                  x1={DIAGRAM_SIZE / 2}
                  y1={DIAGRAM_SIZE / 2}
                  x2={x}
                  y2={y}
                  stroke="#b3b3b3"
                  strokeWidth="1"
                />
              );
            })}
          </svg>

          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 160,
              height: 160,
              bgcolor: '#000000',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Anton", sans-serif',
                fontWeight: 400,
                fontSize: 30,
                letterSpacing: '-0.02em',
              }}
            >
              WHO AM I ?
            </Typography>
            <Typography sx={{ fontSize: 20 }}>↗</Typography>
          </Box>

          {SKILLS.map((skill, i) => {
            const { x, y } = nodePosition(i, SKILLS.length);
            return (
              <Stack
                key={skill.title}
                spacing={0.25}
                sx={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  alignItems: 'center',
                  textAlign: 'center',
                  width: 170,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Alumni Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: 25,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {skill.title}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Alumni Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#949494',
                  }}
                >
                  {skill.subs.join(' · ')}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      </Box>

      {/* Mobile fallback list */}
      <Stack spacing={4} sx={{ display: { xs: 'flex', md: 'none' } }}>
        <Box
          sx={{
            alignSelf: 'center',
            width: 140,
            height: 140,
            bgcolor: '#000000',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <Typography sx={{ fontFamily: '"Anton", sans-serif', fontSize: 18 }}>
            WHO AM I ?
          </Typography>
          <Typography>↗</Typography>
        </Box>
        <Stack spacing={2}>
          {SKILLS.map((skill) => (
            <Stack key={skill.title} spacing={0.25} sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontFamily: '"Alumni Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 22,
                }}
              >
                {skill.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#949494' }}>
                {skill.subs.join(' · ')}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default Skills;
