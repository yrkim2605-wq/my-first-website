import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useAuth } from '../../contexts/AuthContext'

const formatDate = (iso) => new Date(iso).toLocaleString('ko-KR')

const CommentSection = ({ comments, onAdd }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    await onAdd(content.trim())
    setContent('')
    setSubmitting(false)
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        댓글 {comments.length}
      </Typography>

      {user && (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" disabled={submitting}>
            등록
          </Button>
        </Box>
      )}

      <Stack spacing={2}>
        {comments.map((comment) => (
          <Box key={comment.id}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {comment.profiles?.name ?? '익명'}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {formatDate(comment.created_at)}
              </Typography>
            </Typography>
            <Typography variant="body2">{comment.content}</Typography>
            <Divider sx={{ mt: 1.5 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default CommentSection
