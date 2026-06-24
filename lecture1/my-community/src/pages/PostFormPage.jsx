import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PhotoUploader from '../components/common/PhotoUploader'

const PostFormPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({ title, content, user_id: user.id })
      .select()
      .single()

    if (insertError) {
      setError('게시물 등록에 실패했습니다: ' + insertError.message)
      setSubmitting(false)
      return
    }

    for (const file of files) {
      const path = `${post.id}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('post-photos').upload(path, file)
      if (!uploadError) {
        await supabase.from('post_images').insert({ post_id: post.id, storage_path: path })
      }
    }

    setSubmitting(false)
    navigate(`/posts/${post.id}`)
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={0} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          ✏️ 새 게시물 작성
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
          <TextField
            label="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            fullWidth
            multiline
            minRows={6}
          />
          <PhotoUploader files={files} onChange={setFiles} />
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            등록하기
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default PostFormPage
