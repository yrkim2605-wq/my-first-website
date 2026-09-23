import { memo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';

function AboutSectionItem({
  section,
  isExpanded,
  isEditing,
  draftContent,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
}) {
  const isDraftEmpty = draftContent.trim().length === 0;

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      <Accordion
        expanded={isExpanded}
        onChange={(_, expanded) => onToggleExpand(section.id, expanded)}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          '&:before': { display: 'none' },
          overflow: 'hidden',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ pr: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700 }}>{section.title}</Typography>
            {section.showInHome && (
              <Chip
                icon={<HomeIcon fontSize="small" />}
                label="홈 노출"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {isEditing ? (
            <Box>
              <TextField
                value={draftContent}
                onChange={(e) => onDraftChange(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                autoFocus
                error={isDraftEmpty}
                helperText={isDraftEmpty ? '내용을 입력해주세요.' : ' '}
                slotProps={{ htmlInput: { 'aria-label': `${section.title} 내용 수정` } }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={onCancelEdit}>
                  취소
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={isDraftEmpty}
                  onClick={() => onSaveEdit(section.id, draftContent)}
                >
                  저장
                </Button>
              </Stack>
            </Box>
          ) : (
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
              {section.content}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>
      <IconButton
        size="small"
        onClick={() => onStartEdit(section)}
        aria-label={`${section.title} 수정`}
        sx={{ position: 'absolute', top: 6, right: 44 }}
      >
        <EditIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

export default memo(AboutSectionItem);
