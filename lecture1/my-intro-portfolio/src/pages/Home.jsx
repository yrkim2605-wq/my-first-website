import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SectionContainer from '../components/common/SectionContainer'
import CircularText from '../components/common/CircularText'
import RadialSkillDiagram from '../components/common/RadialSkillDiagram'
import { PROFILE, SKILLS, PROJECTS } from '../constants/profile'

const Home = () => {
  return (
    <Box>
      <SectionContainer id="hero" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Anton',
              fontSize: { xs: '4rem', md: '10rem' },
              lineHeight: 0.9,
              color: 'text.primary',
            }}
          >
            IDEA
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <CircularText id="hero" text="TURNING EVERY IDEA INTO A VISUAL EXPERIENCE • " size={220} fontSize={13} />
          </Box>
        </Box>
      </SectionContainer>

      <SectionContainer id="about" sx={{ textAlign: 'center', py: 12, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 24, right: 48, display: { xs: 'none', md: 'block' } }}>
          <CircularText
            id="about"
            text="CONNECTING PEOPLE, STORIES, AND BRANDS INTO VISUAL EXPERIENCE • "
            size={190}
            fontSize={12}
          />
        </Box>
        <Typography
          sx={{
            fontFamily: 'Anton',
            fontSize: { xs: '2.5rem', md: '4.5rem' },
            lineHeight: 1.1,
          }}
        >
          {PROFILE.aboutTitle[0]}
          <br />
          {PROFILE.aboutTitle[1]}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Alumni Sans"',
            fontWeight: 600,
            fontSize: '1.25rem',
            maxWidth: 640,
            mx: 'auto',
            mt: 3,
          }}
        >
          {PROFILE.aboutBody}
        </Typography>
        <Box
          component="a"
          href="#skills"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 200,
            height: 200,
            mx: 'auto',
            mt: 6,
            bgcolor: 'primary.main',
            color: 'background.default',
            textDecoration: 'none',
            fontFamily: 'Anton',
            fontSize: '1.5rem',
          }}
        >
          WHAT I DO ?
        </Box>
      </SectionContainer>

      <SectionContainer id="skills" sx={{ bgcolor: '#dadada', textAlign: 'center', overflowX: 'auto' }}>
        <RadialSkillDiagram items={SKILLS} centerLabel="WHO AM I ?" />
      </SectionContainer>

      <SectionContainer
        id="projects"
        sx={{ bgcolor: 'primary.main', color: 'background.default', py: 12 }}
      >
        <Typography
          sx={{
            fontFamily: 'Anton',
            fontSize: { xs: '2.5rem', md: '4rem' },
          }}
        >
          {PROFILE.projectsTitle}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Alumni Sans"',
            fontWeight: 600,
            fontSize: '1.125rem',
            mt: 2,
          }}
        >
          {PROFILE.projectsSubtitle}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#949494',
            mt: 1,
            mb: 6,
          }}
        >
          {PROFILE.projectsBody}
        </Typography>
        <Grid container spacing={3}>
          {PROJECTS.map((project) => (
            <Grid key={project.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'transparent',
                  color: 'background.default',
                  border: '1px solid #333333',
                  borderRadius: 0,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'secondary.main' },
                }}
              >
                <CardContent>
                  <Typography
                    sx={{ fontFamily: '"Alumni Sans"', fontWeight: 600, fontSize: '1.25rem' }}
                    gutterBottom
                  >
                    {project.title}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#949494' }}>
                    {project.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </SectionContainer>
    </Box>
  )
}

export default Home
