import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import LaunchIcon from '@mui/icons-material/Launch';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

export function ProjectThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Box
        sx={{
          aspectRatio: '4 / 3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'secondary.main',
          color: 'primary.main',
        }}
      >
        <ImageNotSupportedIcon sx={{ fontSize: 40, opacity: 0.6 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      sx={{
        width: '100%',
        aspectRatio: '4 / 3',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

function ProjectCard({ project, onViewDetails }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: '0 12px 24px rgba(43, 26, 15, 0.15)',
        },
      }}
    >
      <ProjectThumbnail src={project.thumbnail_url} alt={project.title} />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {project.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {(project.tech_stack ?? []).map((tech) => (
            <Chip key={tech} label={tech} size="small" color="secondary" sx={{ fontWeight: 600 }} />
          ))}
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          endIcon={<LaunchIcon />}
          component="a"
          href={project.detail_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ transition: 'transform 0.15s ease', '&:active': { transform: 'scale(0.94)' } }}
        >
          Live Demo
        </Button>
        {onViewDetails && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onViewDetails(project)}
            sx={{ transition: 'transform 0.15s ease', '&:active': { transform: 'scale(0.94)' } }}
          >
            View Details
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default ProjectCard;
