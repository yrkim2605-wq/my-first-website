import { memo, useState } from 'react';
import { Box, Card, Fade, IconButton, LinearProgress, Slider, Tooltip, Typography, alpha } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { CATEGORY_COLORS } from '../../data/skillsData';
import { SKILL_ICONS, DEFAULT_SKILL_ICON } from './skillIcons';
import { useInView } from '../../hooks/useInView';
import { useCountUp } from '../../hooks/useCountUp';

function SkillCard({ skill, onLevelChange }) {
  const [editing, setEditing] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.4 });
  const displayLevel = useCountUp(skill.level, { start: inView, duration: 1200 });

  const color = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS['도구 & 기타'];
  const Icon = SKILL_ICONS[skill.icon] ?? DEFAULT_SKILL_ICON;

  return (
    <Fade in timeout={400}>
      <Card
        ref={ref}
        variant="outlined"
        sx={{
          height: '100%',
          p: 2,
          borderRadius: 2,
          borderColor: alpha(color, 0.3),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Tooltip title={skill.description} arrow placement="top">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: alpha(color, 0.12),
                color,
                flexShrink: 0,
              }}
              aria-label={skill.description}
            >
              <Icon fontSize="small" />
            </Box>
          </Tooltip>
          <Typography sx={{ fontWeight: 700, flex: 1 }}>{skill.name}</Typography>
          <Typography sx={{ fontWeight: 700, color, minWidth: '2.5em', textAlign: 'right' }}>
            {displayLevel}%
          </Typography>
          {onLevelChange && (
            <IconButton
              size="small"
              onClick={() => setEditing((prev) => !prev)}
              aria-label={`${skill.name} 숙련도 수정`}
              aria-expanded={editing}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={inView ? skill.level : 0}
          aria-label={`${skill.name} 숙련도 ${skill.level}%`}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(color, 0.12),
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              transition: 'transform 1.2s ease',
            },
          }}
        />
        {editing && onLevelChange && (
          <Slider
            size="small"
            value={skill.level}
            onChange={(_, value) => onLevelChange(skill.id, value)}
            min={0}
            max={100}
            aria-label={`${skill.name} 숙련도 조절`}
            getAriaValueText={(value) => `${value}%`}
            valueLabelDisplay="auto"
            sx={{ mt: 1.5, color, width: 'calc(100% - 8px)', mx: 0.5 }}
          />
        )}
      </Card>
    </Fade>
  );
}

export default memo(SkillCard);
