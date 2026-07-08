import { useCallback, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AvatarFallbackGraphic from '../components/AvatarFallbackGraphic';
import AboutSectionItem from '../components/about/AboutSectionItem';
import SkillsSection from '../components/skills/SkillsSection';
import CircularSkillProgress from '../components/skills/CircularSkillProgress';
import { getTopSkills, CATEGORY_COLORS } from '../data/skillsData';
import { usePortfolio } from '../context/PortfolioContext';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

function AboutMe() {
  const { basicInfo, sections, skills, updatePhoto, updateSectionContent } = usePortfolio();
  const topSkills = getTopSkills(skills, 3);
  const [expanded, setExpanded] = useState(sections[0]?.id ?? false);
  const [editingId, setEditingId] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handlePhotoChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setFeedback({ severity: 'error', message: '이미지 파일만 업로드할 수 있어요.' });
        return;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        setFeedback({ severity: 'error', message: '5MB 이하의 이미지만 업로드할 수 있어요.' });
        return;
      }

      setPhotoUploading(true);
      const reader = new FileReader();
      reader.onload = () => {
        updatePhoto(reader.result);
        setPhotoUploading(false);
      };
      reader.onerror = () => {
        setFeedback({ severity: 'error', message: '이미지를 불러오는 중 문제가 발생했어요.' });
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    },
    [updatePhoto]
  );

  const handleToggleExpand = useCallback((id, isExpanded) => {
    setExpanded(isExpanded ? id : false);
  }, []);

  const handleStartEdit = useCallback((section) => {
    setEditingId(section.id);
    setDraftContent(section.content);
    setExpanded(section.id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setDraftContent('');
  }, []);

  const handleSaveEdit = useCallback(
    (id, content) => {
      if (!content.trim()) return;
      updateSectionContent(id, content);
      setEditingId(null);
      setDraftContent('');
      setFeedback({ severity: 'success', message: '내용이 저장되었습니다.' });
    },
    [updateSectionContent]
  );

  const handleDraftChange = useCallback((value) => {
    setDraftContent(value);
  }, []);

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, mb: { xs: 4, md: 6 }, color: 'primary.main', textAlign: 'center' }}
        >
          About Me
        </Typography>

        {/* 기본 정보 카드 */}
        <Card
          elevation={0}
          variant="outlined"
          sx={{ borderRadius: 3, mb: { xs: 4, md: 6 }, borderColor: 'divider' }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 3, sm: 4 },
              p: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={basicInfo.photo || undefined}
                alt={basicInfo.name}
                slotProps={{ img: { loading: 'lazy' } }}
                sx={{
                  width: { xs: 96, sm: 120 },
                  height: { xs: 96, sm: 120 },
                  background: 'linear-gradient(135deg, #7C6BFF 0%, #4F3CF2 100%)',
                  opacity: photoUploading ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {!basicInfo.photo && <AvatarFallbackGraphic size={{ xs: 54, sm: 68 }} />}
              </Avatar>
              {photoUploading && (
                <CircularProgress
                  size={28}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-14px',
                    marginLeft: '-14px',
                  }}
                  aria-label="사진 업로드 중"
                />
              )}
              <Button
                component="label"
                size="small"
                variant="contained"
                color="primary"
                disabled={photoUploading}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  minWidth: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  p: 0,
                }}
                aria-label="프로필 사진 업로드"
              >
                <PhotoCameraIcon fontSize="small" />
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Button>
            </Box>

            <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flex: 1 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                {basicInfo.name}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' }, mb: basicInfo.certifications?.length ? 1 : 0 }}
              >
                <Chip label={basicInfo.education} variant="outlined" color="primary" size="small" />
                <Chip label={basicInfo.major} variant="outlined" color="primary" size="small" />
                <Chip label={basicInfo.experience} color="primary" size="small" />
              </Stack>
              {basicInfo.certifications?.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}
                >
                  {basicInfo.certifications.map((cert) => (
                    <Chip
                      key={cert}
                      icon={<WorkspacePremiumIcon fontSize="small" />}
                      label={cert}
                      variant="outlined"
                      color="secondary"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* 콘텐츠 섹션 (아코디언) */}
        <Box>
          {sections.map((section) => {
            const isEditing = editingId === section.id;
            return (
              <AboutSectionItem
                key={section.id}
                section={section}
                isExpanded={expanded === section.id}
                isEditing={isEditing}
                draftContent={isEditing ? draftContent : ''}
                onToggleExpand={handleToggleExpand}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onDraftChange={handleDraftChange}
              />
            );
          })}
        </Box>

        {/* 핵심 역량 (원형 프로그레스) */}
        {topSkills.length > 0 && (
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
              핵심 역량
            </Typography>
            <Stack
              direction="row"
              spacing={4}
              useFlexGap
              sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {topSkills.map((skill) => (
                <CircularSkillProgress
                  key={skill.id}
                  name={skill.name}
                  level={skill.level}
                  color={CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS['도구 & 기타']}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* 스킬 섹션 */}
        <SkillsSection />
      </Container>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback && (
          <Alert
            onClose={() => setFeedback(null)}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}

export default AboutMe;
