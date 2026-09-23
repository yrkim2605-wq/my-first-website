import { Card, CardActions, CardContent, Skeleton, Stack } from '@mui/material';

function ProjectCardSkeleton() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Skeleton variant="rectangular" animation="wave" sx={{ width: '100%', aspectRatio: '4 / 3' }} />
      <CardContent>
        <Skeleton variant="text" width="70%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="85%" sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={56} height={24} />
          <Skeleton variant="rounded" width={64} height={24} />
          <Skeleton variant="rounded" width={48} height={24} />
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Skeleton variant="rounded" width={100} height={32} />
        <Skeleton variant="rounded" width={100} height={32} />
      </CardActions>
    </Card>
  );
}

export default ProjectCardSkeleton;
