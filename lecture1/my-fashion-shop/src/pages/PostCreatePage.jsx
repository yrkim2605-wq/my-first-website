import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['아우터', '상의', '하의', '원피스', '신발', '가방', '소품', '기타']

const PostCreatePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [photos, setPhotos] = useState([])       // { file, preview } 배열
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])
  const [category, setCategory] = useState('상의')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTag = tagInput.trim().replace('#', '')
      if (!tags.includes(newTag)) setTags([...tags, newTag])
      setTagInput('')
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - photos.length
    files.slice(0, remaining).forEach((file) => {
      const preview = URL.createObjectURL(file)
      setPhotos((prev) => [...prev, { file, preview }])
    })
  }

  const handleRemovePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (photos.length === 0) { setError('사진을 최소 1장 업로드해주세요.'); return }

    setLoading(true)
    setError('')

    try {
      // 1. posts 테이블에 게시물 생성
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          is_public: isPublic,
        })
        .select()
        .single()

      if (postError) throw postError

      // 2. 이미지 업로드 (Storage → post_images 테이블)
      for (let i = 0; i < photos.length; i++) {
        const { file } = photos[i]
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${post.id}/${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, file)

        if (!uploadError) {
          await supabase.from('post_images').insert({
            post_id: post.id,
            storage_path: path,
            order_index: i,
          })
        }
      }

      navigate('/posts')
    } catch (err) {
      setError('게시물 업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ bgcolor: '#0B0B0B', minHeight: '100vh', pb: 3 }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', px: 1, py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky', top: 56, bgcolor: '#0B0B0B', zIndex: 10,
        }}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>
          코디 올리기
        </Typography>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            color: '#39FF14', fontWeight: 700, fontSize: 15,
            '&:hover': { bgcolor: 'rgba(57,255,20,0.08)' },
            '&:disabled': { color: 'rgba(57,255,20,0.3)' },
          }}
        >
          {loading ? <CircularProgress size={18} sx={{ color: '#39FF14' }} /> : '게시'}
        </Button>
      </Box>

      <Box sx={{ px: 2, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255,0,0,0.1)', color: '#ff6b6b' }}>
            {error}
          </Alert>
        )}

        {/* 사진 업로드 */}
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mb: 3 }}>
          <Box
            component="label"
            sx={{
              flexShrink: 0, width: 100, height: 130, borderRadius: 2.5,
              border: '2px dashed rgba(255,255,255,0.15)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 0.5, cursor: 'pointer',
              '&:hover': { borderColor: '#39FF14', bgcolor: 'rgba(57,255,20,0.03)' },
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
            />
            <AddPhotoAlternateOutlinedIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 28 }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              {photos.length}/5
            </Typography>
          </Box>

          {photos.map((photo, idx) => (
            <Box
              key={idx}
              sx={{ flexShrink: 0, width: 100, height: 130, borderRadius: 2.5, overflow: 'hidden', position: 'relative' }}
            >
              <Box
                component="img"
                src={photo.preview}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {idx === 0 && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bgcolor: 'rgba(57,255,20,0.85)', textAlign: 'center', py: 0.3 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#0B0B0B' }}>대표</Typography>
                </Box>
              )}
              <IconButton
                size="small"
                onClick={() => handleRemovePhoto(idx)}
                sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', p: 0.3 }}
              >
                <CloseRoundedIcon sx={{ fontSize: 14, color: 'white' }} />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* 제목 */}
        <TextField
          fullWidth
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: false,
            sx: { color: 'white', fontSize: 18, fontWeight: 600 },
          }}
          sx={{
            mb: 2,
            '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
            '& .MuiInput-underline:after': { borderBottomColor: '#39FF14' },
          }}
        />

        {/* 내용 */}
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="코디 설명을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          InputProps={{
            sx: {
              bgcolor: '#141414', color: 'white', borderRadius: 2, fontSize: 14,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&.Mui-focused fieldset': { borderColor: '#39FF14' },
            },
          }}
          sx={{ mb: 2.5 }}
        />

        {/* 태그 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
            태그
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                onDelete={() => setTags(tags.filter((t) => t !== tag))}
                sx={{
                  bgcolor: 'rgba(57,255,20,0.1)', color: '#39FF14',
                  border: '1px solid rgba(57,255,20,0.3)',
                  '& .MuiChip-deleteIcon': { color: 'rgba(57,255,20,0.6)' },
                }}
              />
            ))}
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="#태그 입력 후 Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            InputProps={{
              sx: {
                bgcolor: '#141414', color: 'white', borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&.Mui-focused fieldset': { borderColor: '#39FF14' },
              },
            }}
          />
        </Box>

        {/* 카테고리 */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
            카테고리
          </Typography>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            size="small"
            sx={{
              bgcolor: '#141414', color: 'white', borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#39FF14' },
              '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
            }}
            MenuProps={{ PaperProps: { sx: { bgcolor: '#1A1A1A', color: 'white' } } }}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* 공개 여부 */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: '#141414', borderRadius: 2, px: 2, py: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 14 }}>전체 공개</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {isPublic ? '모든 사용자에게 공개됩니다' : '나만 볼 수 있습니다'}
            </Typography>
          </Box>
          <Switch
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#39FF14' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#39FF14' },
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default PostCreatePage
