import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { useProfile } from '../hooks/useProfile'
import { communityRepository } from '../storage/communityRepository'
import { COMMENT_CONTENT_MAX } from '../storage/supabaseCommunityRepository'
import { formatPostDate, isEdited, levelFromIndex } from '../utils/communityFormat'
import AuthorInfo from '../components/common/AuthorInfo'
import StatusMessage from '../components/common/StatusMessage'
import Reveal from '../components/common/Reveal'
import { RADIUS } from '../theme'

// 계정 모드의 글 상세예요: 서버에 저장된 실제 글 · 댓글 · 좋아요를 보여줘요.
//  - 글은 작성자만 고치고 지울 수 있어요. 댓글은 쓰기 · 지우기만 되고 수정은 없어요(싫어요도 없어요).
//  - 저장에 성공한 뒤에만 화면이 바뀌고, 실패하면 이유를 알려요.
//  - 글 · 댓글 · 좋아요는 EXP에 반영되지 않아요.

const TEXT_BUTTON_SX = { minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }

const CommentCard = ({ comment, isReply = false, canReply, isReplying, replyDraft, isBusy, onToggleReply, onChangeReply, onSubmitReply, onDelete }) => (
  <Box>
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        p: 2,
        borderRadius: RADIUS.lg,
        border: '1px solid rgba(46,42,37,0.08)',
        bgcolor: isReply ? 'rgba(46,42,37,0.02)' : 'background.paper',
      }}
    >
      {isReply && <SubdirectoryArrowRightIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.5 }} />}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AuthorInfo author={comment.author} level={levelFromIndex(comment.authorLevelIndex)} caption={formatPostDate(comment.createdAt)} avatarSize={40} />
        <Typography variant="body2" sx={{ mt: 1, mb: 1, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
          {comment.content}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {canReply && (
            <Button size="small" onClick={onToggleReply} sx={TEXT_BUTTON_SX}>
              {isReplying ? '답글 닫기' : '답글 달기'}
            </Button>
          )}
          {comment.isMine && (
            <Button size="small" color="error" onClick={onDelete} disabled={isBusy} sx={TEXT_BUTTON_SX}>
              삭제
            </Button>
          )}
        </Box>
      </Box>
    </Box>

    {isReplying && (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1.5, pl: { xs: 2.5, sm: 4 } }}>
        <TextField
          value={replyDraft}
          onChange={(event) => onChangeReply(event.target.value)}
          placeholder={`${comment.author}님에게 답글 남기기`}
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          size="small"
          autoFocus
          slotProps={{ htmlInput: { maxLength: COMMENT_CONTENT_MAX } }}
        />
        <Button variant="contained" size="small" onClick={onSubmitReply} disabled={!replyDraft.trim() || isBusy} sx={{ flexShrink: 0 }}>
          등록
        </Button>
      </Box>
    )}
  </Box>
)

const AccountPostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, ready } = useProfile()
  const userId = profile?.userId ?? null

  const requestKey = `${id}|${userId}`
  const [state, setState] = useState({ key: null, post: null, comments: [], errorMessage: null })
  const [retryCount, setRetryCount] = useState(0)
  const [isBusy, setIsBusy] = useState(false) // 저장 중에는 같은 버튼을 또 눌러도 무시해요
  const [actionError, setActionError] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null) // { type: 'post' | 'comment', id }

  const fetchAll = useCallback(() => Promise.all([communityRepository.getPost(id), communityRepository.listComments(id)]), [id])

  useEffect(() => {
    let isCancelled = false
    fetchAll()
      .then(([post, comments]) => !isCancelled && setState({ key: `${requestKey}|${retryCount}`, post, comments, errorMessage: null }))
      .catch((error) => !isCancelled && setState({ key: `${requestKey}|${retryCount}`, post: null, comments: [], errorMessage: error.message }))
    return () => {
      isCancelled = true
    }
  }, [fetchAll, requestKey, retryCount])

  const isLoading = state.key !== `${requestKey}|${retryCount}`
  const { post, comments } = state

  // 저장이 끝난 뒤 글과 댓글을 다시 불러와요 (서버가 센 좋아요 · 댓글 수를 그대로 보여주려고요)
  const refresh = async () => {
    const [freshPost, freshComments] = await fetchAll()
    setState((prev) => ({ ...prev, post: freshPost, comments: freshComments, errorMessage: null }))
  }

  // 공통 실행기: 한 번에 하나만 실행하고, 실패하면 이유를 보여줘요
  const runAction = async (action) => {
    if (isBusy) return false
    setIsBusy(true)
    setActionError(null)
    try {
      await action()
      return true
    } catch (error) {
      setActionError(error.message)
      return false
    } finally {
      setIsBusy(false)
    }
  }

  const handleToggleLike = () => {
    if (!profile) {
      navigate('/login')
      return
    }
    runAction(async () => {
      await communityRepository.setLike(post.id, !post.likedByMe)
      await refresh()
    })
  }

  const handleAddComment = async () => {
    const ok = await runAction(async () => {
      await communityRepository.addComment({ postId: post.id, content: commentDraft })
      await refresh()
    })
    if (ok) setCommentDraft('') // 저장에 성공했을 때만 입력칸을 비워요
  }

  const handleAddReply = async (parentId) => {
    const ok = await runAction(async () => {
      await communityRepository.addComment({ postId: post.id, content: replyDraft, parentId })
      await refresh()
    })
    if (ok) {
      setReplyDraft('')
      setReplyingToId(null)
    }
  }

  const handleConfirmDelete = async () => {
    const target = confirmTarget
    setConfirmTarget(null)
    if (!target) return
    if (target.type === 'post') {
      const ok = await runAction(() => communityRepository.deletePost(post.id))
      if (ok) navigate('/community', { replace: true })
      return
    }
    await runAction(async () => {
      await communityRepository.deleteComment(target.id)
      await refresh()
    })
  }

  const backLink = (
    <Typography
      component={Link}
      to="/community"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        color: 'text.secondary',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: 600,
        minHeight: 44,
        mb: 2.5,
        '&:hover': { color: 'primary.main' },
      }}
    >
      <ArrowBackIcon sx={{ fontSize: '0.85rem' }} />
      커뮤니티로
    </Typography>
  )

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: { xs: 5, sm: 8 } }}>
          {backLink}
          <StatusMessage title="글을 불러오고 있어요" description="잠시만 기다려 주세요." />
        </Box>
      </Container>
    )
  }

  if (state.errorMessage) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: { xs: 5, sm: 8 } }}>
          {backLink}
          <StatusMessage title="글을 불러오지 못했어요" description={state.errorMessage} actionLabel="다시 시도" onAction={() => setRetryCount((count) => count + 1)} />
        </Box>
      </Container>
    )
  }

  if (!post) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: { xs: 5, sm: 8 } }}>
          {backLink}
          <StatusMessage title="글을 찾을 수 없어요" description="지워졌거나 주소가 잘못됐을 수 있어요." actionLabel="커뮤니티로 가기" onAction={() => navigate('/community')} />
        </Box>
      </Container>
    )
  }

  const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
  const totalCommentCount = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0)

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
        {backLink}

        <Reveal>
          {/* 실제 글에는 사진이 없어서 카테고리 이모지를 아치에 담아요 */}
          <Box
            aria-hidden="true"
            sx={{
              width: '100%',
              height: { xs: 150, sm: 200 },
              display: 'grid',
              placeItems: 'center',
              fontSize: { xs: '4rem', sm: '5.5rem' },
              // 위쪽이 둥근 아치 모양
              borderRadius: '999px 999px 18px 18px',
              bgcolor: 'rgba(143,166,126,0.22)',
              border: '3px solid #c9a56a',
              boxShadow: '0 3px 0 rgba(107,68,35,0.25)',
              mb: 3,
            }}
          >
            {category?.emoji ?? '🍞'}
          </Box>
        </Reveal>

        <Reveal delay={0.05}>
          <Box sx={{ ...PARCHMENT_SX, borderRadius: '20px', p: { xs: 2.5, sm: 3.5 }, mb: 3 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'terracotta.main', mb: 1 }}>{category?.label}</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 2, wordBreak: 'break-word' }}>
              {post.title}
            </Typography>
            <AuthorInfo
              author={post.author}
              level={levelFromIndex(post.authorLevelIndex)}
              caption={`${formatPostDate(post.createdAt)}${isEdited(post) ? ` · 수정됨 ${formatPostDate(post.updatedAt)}` : ''}`}
              avatarSize={52}
              sx={{ mb: 2.5 }}
            />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
              {post.content}
            </Typography>
          </Box>
        </Reveal>

        {actionError && (
          <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            py: 1.5,
            mb: 4,
            borderTop: '1px solid rgba(46,42,37,0.08)',
            borderBottom: '1px solid rgba(46,42,37,0.08)',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={handleToggleLike}
            disabled={isBusy}
            aria-pressed={post.likedByMe}
            aria-label={post.likedByMe ? `좋아요 취소 (현재 ${post.heartCount}개)` : `좋아요 (현재 ${post.heartCount}개)`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minHeight: 44,
              px: 1,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: post.likedByMe ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s ease, transform 0.15s ease',
              '&:hover': { color: 'primary.main' },
              '&:active': { transform: 'scale(0.9)' },
              '&:disabled': { cursor: 'default', opacity: 0.6 },
            }}
          >
            {post.likedByMe ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {post.heartCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {totalCommentCount}
            </Typography>
          </Box>
          {post.isMine && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              <Button component={Link} to={`/community/${post.id}/edit`} size="small" sx={TEXT_BUTTON_SX}>
                글 수정
              </Button>
              <Button size="small" color="error" onClick={() => setConfirmTarget({ type: 'post' })} disabled={isBusy} sx={TEXT_BUTTON_SX}>
                글 삭제
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="h2" sx={{ mb: 1.5 }}>
          댓글 ({totalCommentCount})
        </Typography>

        {profile ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 4 }}>
            <TextField
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="댓글을 남겨보세요"
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { maxLength: COMMENT_CONTENT_MAX } }}
              helperText={commentDraft ? `${commentDraft.length}/${COMMENT_CONTENT_MAX}` : undefined}
            />
            <Button variant="contained" onClick={handleAddComment} disabled={!commentDraft.trim() || isBusy} sx={{ flexShrink: 0 }}>
              등록
            </Button>
          </Box>
        ) : ready ? (
          <Box sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 2, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>로그인하면 댓글과 좋아요를 남길 수 있어요.</Typography>
            <Button component={Link} to="/login" variant="contained" size="small">
              로그인
            </Button>
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </Typography>
          )}
          {comments.map((comment) => (
            <Box key={comment.id}>
              <CommentCard
                comment={comment}
                canReply={Boolean(profile)}
                isReplying={replyingToId === comment.id}
                replyDraft={replyDraft}
                isBusy={isBusy}
                onToggleReply={() => {
                  setReplyingToId(replyingToId === comment.id ? null : comment.id)
                  setReplyDraft('')
                }}
                onChangeReply={setReplyDraft}
                onSubmitReply={() => handleAddReply(comment.id)}
                onDelete={() => setConfirmTarget({ type: 'comment', id: comment.id })}
              />
              {comment.replies.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5, pl: { xs: 2.5, sm: 4 } }}>
                  {comment.replies.map((reply) => (
                    <CommentCard key={reply.id} comment={reply} isReply isBusy={isBusy} onDelete={() => setConfirmTarget({ type: 'comment', id: reply.id })} />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)} aria-labelledby="community-delete-title">
        <DialogTitle id="community-delete-title">{confirmTarget?.type === 'post' ? '이 글을 지울까요?' : '이 댓글을 지울까요?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
            {confirmTarget?.type === 'post'
              ? '글에 달린 댓글과 좋아요도 함께 지워지고, 되돌릴 수 없어요.'
              : '이 댓글에 달린 답글도 함께 지워지고, 되돌릴 수 없어요.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmTarget(null)}>
            취소
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            지우기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default AccountPostDetail
