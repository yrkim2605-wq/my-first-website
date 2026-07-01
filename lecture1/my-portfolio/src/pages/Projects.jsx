import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../lib/supabaseClient';
import ProjectCard, { ProjectThumbnail } from '../components/projects/ProjectCard';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setProjects(data ?? []);
      setLoading(false);
    };
    loadProjects();
  }, []);

  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
            Projects
          </Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
            직접 기획하고 개발한 프로젝트들을 소개합니다.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary" align="center">
            아직 등록된 프로젝트가 없습니다.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onViewDetails={setSelected} />
            ))}
          </Box>
        )}
      </Container>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <IconButton
              onClick={() => setSelected(null)}
              sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, bgcolor: 'background.paper' }}
            >
              <CloseIcon />
            </IconButton>
            <ProjectThumbnail src={selected.thumbnail_url} alt={selected.title} />
            <DialogContent>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                {selected.title}
              </Typography>
              <Typography sx={{ mb: selected.story ? 1 : 2, color: 'text.secondary' }}>{selected.description}</Typography>
              {selected.story && (
                <Typography
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    color: 'primary.main',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    pl: 1.5,
                  }}
                >
                  “{selected.story}”
                </Typography>
              )}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {(selected.tech_stack ?? []).map((tech) => (
                  <Chip key={tech} label={tech} size="small" color="secondary" sx={{ fontWeight: 600 }} />
                ))}
              </Stack>
              <Button
                variant="contained"
                endIcon={<LaunchIcon />}
                component="a"
                href={selected.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
              >
                Live Demo 바로가기
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Projects;
