import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import SectionHeading from '../components/common/SectionHeading'
import StatusMessage from '../components/common/StatusMessage'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { useProfile } from '../hooks/useProfile'
import { communityRepository } from '../storage/communityRepository'
import { POST_CONTENT_MAX, POST_TITLE_MAX } from '../storage/supabaseCommunityRepository'
import { DISPLAY_FONT, RADIUS } from '../theme'

// 계정 모드의 글쓰기 · 글 고치기 화면이에요. (/community/write, /community/:id/edit)
//  - 로그인(이메일 인증 완료)한 사용자만 쓸 수 있고, 고치기는 내 글만 열려요 (서버 권한으로도 막혀요).
//  - 사진 첨부는 아직 없어요. 저장에 성공한 뒤에만 글 화면으로 이동하고, 실패하면 쓰던 내용을 그대로 두고 이유를 알려요.

const FIELD_SX = { '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.55)' } }

// 쓰는 칸들. 처음 값(initial)으로 시작하고, 이 컴포넌트는 글 정보를 다 불러온 뒤에 그려져요.
const PostEditor = ({ mode, initial, cancelTo, onSubmit }) => {
  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [title, setTitle] = useState(initial.title)
  const [content, setContent] = useState(initial.content)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const canSubmit = Boolean(categoryId && title.trim() && content.trim()) && !isSaving

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      await onSubmit({ categoryId, title, content })
      // 성공하면 화면이 이동해요
    } catch (error) {
      setErrorMessage(error.message) // 쓰던 내용은 그대로 남겨요
      setIsSaving(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        position: 'relative',
        ...PARCHMENT_SX,
        borderRadius: '20px',
        p: { xs: 2.5, sm: 3.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        // 압정
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -7,
          left: 28,
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: '#d9735e',
          border: '2px solid #3e2713',
          boxShadow: '0 2px 0 rgba(33,20,10,0.4)',
        },
      }}
    >
      <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1rem', mb: 1 }}>
          어떤 이야기인가요?
        </Typography>
        <Box role="radiogroup" aria-label="카테고리" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {COMMUNITY_CATEGORIES.map((category) => {
            const isSelected = categoryId === category.id
            return (
              <Box
                key={category.id}
                component="button"
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setCategoryId(category.id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  minHeight: 44,
                  px: 1.75,
                  borderRadius: RADIUS.pill,
                  border: '2px solid',
                  borderColor: isSelected ? '#3e2713' : 'rgba(201,165,106,0.8)',
                  bgcolor: isSelected ? '#6b4423' : 'rgba(255,255,255,0.5)',
                  color: isSelected ? '#fbf6ea' : 'text.primary',
                  boxShadow: isSelected ? '0 2px 0 rgba(33,20,10,0.35)' : 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                  '&:hover': { borderColor: '#6b4423' },
                  '&:focus-visible': { outline: '3px solid', outlineColor: 'gold.main', outlineOffset: 2 },
                }}
              >
                <span aria-hidden="true">{category.emoji}</span>
                {category.label}
              </Box>
            )
          })}
        </Box>
      </Box>

      <TextField
        label="제목"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        fullWidth
        required
        slotProps={{ htmlInput: { maxLength: POST_TITLE_MAX } }}
        helperText={`${title.length}/${POST_TITLE_MAX}`}
        sx={FIELD_SX}
      />
      <TextField
        label="내용"
        placeholder="다녀온 빵집, 맛, 분위기, 팁을 자유롭게 남겨보세요"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        fullWidth
        required
        multiline
        minRows={8}
        slotProps={{ htmlInput: { maxLength: POST_CONTENT_MAX } }}
        helperText={`${content.length}/${POST_CONTENT_MAX}`}
        sx={FIELD_SX}
      />

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button component={Link} to={cancelTo} color="inherit" variant="outlined" disabled={isSaving}>
          취소
        </Button>
        <Button type="submit" variant="contained" disabled={!canSubmit}>
          {isSaving ? '저장 중…' : mode === 'edit' ? '수정 완료' : '글 올리기'}
        </Button>
      </Box>
    </Box>
  )
}

const CommunityPostForm = () => {
  const { id } = useParams()
  const mode = id ? 'edit' : 'write'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, ready } = useProfile()

  // 고치기: 기존 글을 불러와요 (key가 id와 같으면 불러온 거예요)
  const [loaded, setLoaded] = useState({ key: null, post: null, errorMessage: null })
  const userId = profile?.userId ?? null
  const loadKey = mode === 'edit' && userId ? `${id}|${userId}` : null

  useEffect(() => {
    if (!loadKey) return undefined
    let isCancelled = false
    communityRepository
      .getPost(id)
      .then((post) => !isCancelled && setLoaded({ key: loadKey, post, errorMessage: null }))
      .catch((error) => !isCancelled && setLoaded({ key: loadKey, post: null, errorMessage: error.message }))
    return () => {
      isCancelled = true
    }
  }, [id, loadKey])

  const backTo = mode === 'edit' ? `/community/${id}` : '/community'
  const wrap = (children) => (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 4, sm: 6 }, pb: { xs: 8, sm: 10 } }}>
        <Typography
          component={Link}
          to={backTo}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color: 'text.secondary', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, minHeight: 44, mb: 1.5, '&:hover': { color: 'primary.main' } }}
        >
          <ArrowBackIcon sx={{ fontSize: '0.85rem' }} />
          {mode === 'edit' ? '글로 돌아가기' : '커뮤니티로'}
        </Typography>
        <SectionHeading
          variant="board"
          eyebrow="ADVENTURERS' SQUARE"
          title={mode === 'edit' ? '글 고치기' : '새 글 쓰기'}
          description={mode === 'edit' ? '내가 쓴 글만 고칠 수 있어요.' : '모험가들과 빵집 이야기를 나눠요.'}
          sx={{ mb: { xs: 3, sm: 4 } }}
        />
        {children}
      </Box>
    </Container>
  )

  if (!ready) return wrap(<StatusMessage title="확인하고 있어요" description="잠시만 기다려 주세요." />)

  if (!profile) {
    return wrap(
      <StatusMessage
        title="모험가만 글을 쓸 수 있어요"
        description="이메일로 로그인하고 인증을 마치면 글을 남길 수 있어요."
        actionLabel="로그인하러 가기"
        onAction={() => navigate('/login')}
      />,
    )
  }

  if (mode === 'write') {
    const requestedCategory = searchParams.get('category')
    const initial = {
      categoryId: COMMUNITY_CATEGORIES.some((c) => c.id === requestedCategory) ? requestedCategory : null,
      title: '',
      content: '',
    }
    return wrap(
      <>
        <LocalProfileNotice
          sx={{ mb: 3 }}
          accountChildren={
            <>
              글은 <b>{profile.nickname}</b> 닉네임으로 모두에게 공개돼요. 사진 첨부는 아직 없고, 하루에 글 10개까지 쓸 수 있어요. 글은 EXP에
              반영되지 않아요.
            </>
          }
        />
        <PostEditor
          mode="write"
          initial={initial}
          cancelTo="/community"
          onSubmit={async (values) => {
            const newId = await communityRepository.createPost(values)
            navigate(`/community/${newId}`, { replace: true })
          }}
        />
      </>,
    )
  }

  // 고치기
  if (loaded.key !== loadKey) return wrap(<StatusMessage title="글을 불러오고 있어요" description="잠시만 기다려 주세요." />)
  if (loaded.errorMessage) {
    return wrap(<StatusMessage title="글을 불러오지 못했어요" description={loaded.errorMessage} actionLabel="커뮤니티로 가기" onAction={() => navigate('/community')} />)
  }
  if (!loaded.post) {
    return wrap(<StatusMessage title="글을 찾을 수 없어요" description="지워졌거나 주소가 잘못됐을 수 있어요." actionLabel="커뮤니티로 가기" onAction={() => navigate('/community')} />)
  }
  if (!loaded.post.isMine) {
    return wrap(<StatusMessage title="내가 쓴 글만 고칠 수 있어요" description="다른 모험가의 글은 고칠 수 없어요." actionLabel="글 보러 가기" onAction={() => navigate(`/community/${id}`)} />)
  }
  return wrap(
    <PostEditor
      key={loaded.post.id}
      mode="edit"
      initial={{ categoryId: loaded.post.categoryId, title: loaded.post.title, content: loaded.post.content }}
      cancelTo={`/community/${id}`}
      onSubmit={async (values) => {
        await communityRepository.updatePost(id, values)
        navigate(`/community/${id}`, { replace: true })
      }}
    />,
  )
}

export default CommunityPostForm
