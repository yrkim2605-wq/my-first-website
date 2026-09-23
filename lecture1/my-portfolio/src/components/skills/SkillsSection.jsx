import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SkillCard from './SkillCard';
import { SKILL_ICONS, DEFAULT_SKILL_ICON } from './skillIcons';
import { additionalSkillsCatalog, CATEGORY_ORDER, CATEGORY_COLORS } from '../../data/skillsData';
import { usePortfolio } from '../../context/PortfolioContext';

function SkillsSection() {
  const { skills, updateSkillLevel, addSkill } = usePortfolio();
  const [dialogOpen, setDialogOpen] = useState(false);

  const addableSkills = useMemo(
    () => additionalSkillsCatalog.filter((candidate) => !skills.some((skill) => skill.name === candidate.name)),
    [skills]
  );

  const handleAddSkill = useCallback(
    (candidate) => {
      addSkill(candidate);
      setDialogOpen(false);
    },
    [addSkill]
  );

  const skillsByCategory = useMemo(() => {
    const grouped = new Map();
    CATEGORY_ORDER.forEach((category) => {
      const categorySkills = skills.filter((skill) => skill.category === category);
      if (categorySkills.length > 0) {
        grouped.set(category, categorySkills);
      }
    });
    return grouped;
  }, [skills]);

  return (
    <Box sx={{ mt: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Skills
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          color="primary"
          onClick={() => setDialogOpen(true)}
          disabled={addableSkills.length === 0}
          aria-label="새 스킬 추가"
        >
          스킬 추가
        </Button>
      </Box>

      {[...skillsByCategory.entries()].map(([category, categorySkills]) => (
        <Box key={category} sx={{ mb: 4 }} component="section" aria-label={`${category} 스킬`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: CATEGORY_COLORS[category],
              }}
            />
            <Typography sx={{ fontWeight: 700, color: CATEGORY_COLORS[category] }} component="h3">
              {category}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {categorySkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onLevelChange={updateSkillLevel} />
            ))}
          </Box>
        </Box>
      ))}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="add-skill-dialog-title"
      >
        <DialogTitle id="add-skill-dialog-title">스킬 추가</DialogTitle>
        <DialogContent dividers>
          <List disablePadding>
            {addableSkills.map((candidate) => {
              const Icon = SKILL_ICONS[candidate.icon] ?? DEFAULT_SKILL_ICON;
              return (
                <ListItemButton
                  key={candidate.name}
                  onClick={() => handleAddSkill(candidate)}
                  aria-label={`${candidate.name} (${candidate.category}) 추가`}
                >
                  <ListItemIcon>
                    <Icon sx={{ color: CATEGORY_COLORS[candidate.category] }} />
                  </ListItemIcon>
                  <ListItemText primary={candidate.name} secondary={candidate.category} />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SkillsSection;
