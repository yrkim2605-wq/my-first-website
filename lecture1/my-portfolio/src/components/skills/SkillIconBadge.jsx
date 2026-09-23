import { memo } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { CATEGORY_COLORS } from '../../data/skillsData';
import { SKILL_ICONS, DEFAULT_SKILL_ICON } from './skillIcons';

function SkillIconBadge({ skill }) {
  const color = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS['도구 & 기타'];
  const Icon = SKILL_ICONS[skill.icon] ?? DEFAULT_SKILL_ICON;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, width: 76 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.12),
          color,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center' }}>
        {skill.name}
      </Typography>
    </Box>
  );
}

export default memo(SkillIconBadge);
