import { useEffect, useRef, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import { COMMUNITY_POSTS } from '../constants/communityPosts'
import { COMMUNITY_CATEGORIES } from '../constants/categories'
import { COMMUNITY_COMMENTS } from '../constants/communityComments'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../constants/bakeryPhotos'
import { MOCK_USER } from '../constants/userProfile'
import { getAuthorLevel } from '../utils/authorLevel'
import { getPostAvatarEmoji, getPostPhotoBakeryId } from '../utils/communityPostMeta'
import Reveal from '../components/common/Reveal'

const TODAY = new Date().toISOString().slice(0, 10)

const CommentAuthor = ({ author, avatarEmoji, createdAt }) => {
  const level = getAuthorLevel(author)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        variant="rounded"
        src={level?.iconImage}
        sx={{ width: 28, height: 26, borderRadius: '7px', fontSize: '0.9rem' }}
      >
        {avatarEmoji}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {author}
          </Typography>
          {level && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                px: 0.6,
                py: 0.1,
                borderRadius: 999,
                bgcolor: '#F3D9A8',
                color: '#7A4A16',
                fontSize: '0.6rem',
                fontWeight: 800,
                lineHeight: 1.4,
              }}
            >
              <span>{level.emoji}</span>
              {level.name}
            </Box>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {createdAt}
        </Typography>
      </Box>
    </Box>
  )
}

const VoteButtons = ({ itemId, likeCount, dislikeCount, vote, onVote }) => {
  const displayedLike = likeCount + (vote === 'like' ? 1 : 0)
  const displayedDislike = dislikeCount + (vote === 'dislike' ? 1 : 0)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        component="button"
        type="button"
        onClick={() => onVote(itemId, 'like')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.4,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: vote === 'like' ? 'primary.main' : 'text.secondary',
          transition: 'color 0.2s ease, transform 0.15s ease',
          '&:hover': { color: 'primary.main' },
          '&:active': { transform: 'scale(0.9)' },
        }}
      >
        {vote === 'like' ? (
          <ThumbUpAltIcon sx={{ fontSize: '1rem' }} />
        ) : (
          <ThumbUpAltOutlinedIcon sx={{ fontSize: '1rem' }} />
        )}
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {displayedLike}
        </Typography>
      </Box>
      <Box
        component="button"
        type="button"
        onClick={() => onVote(itemId, 'dislike')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.4,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: vote === 'dislike' ? '#B3452C' : 'text.secondary',
          transition: 'color 0.2s ease, transform 0.15s ease',
          '&:hover': { color: '#B3452C' },
          '&:active': { transform: 'scale(0.9)' },
        }}
      >
        {vote === 'dislike' ? (
          <ThumbDownAltIcon sx={{ fontSize: '1rem' }} />
        ) : (
          <ThumbDownAltOutlinedIcon sx={{ fontSize: '1rem' }} />
        )}
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {displayedDislike}
        </Typography>
      </Box>
    </Box>
  )
}

const CommunityPostDetail = () => {
  const { id } = useParams()
  const post = COMMUNITY_POSTS.find((p) => String(p.id) === id)

  const nextCommentId = useRef(0)
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState(() => COMMUNITY_COMMENTS[post?.id] || [])
  const [commentDraft, setCommentDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [votes, setVotes] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    setComments(COMMUNITY_COMMENTS[post?.id] || [])
    setReplyingToId(null)
    setReplyDraft('')
    setVotes({})
    setEditingId(null)
    setEditDraft('')
  }, [post?.id])

  if (!post) {
    return <Navigate to="/community" replace />
  }

  const category = COMMUNITY_CATEGORIES.find((c) => c.id === post.categoryId)
  const authorLevel = getAuthorLevel(post.author)
  const avatarEmoji = getPostAvatarEmoji(post)
  const photoSrc = BAKERY_PHOTO_BY_ID[getPostPhotoBakeryId(post)] || DEFAULT_BAKERY_PHOTO
  const displayedHeartCount = post.heartCount + (liked ? 1 : 0)
  const totalCommentCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)

  const handleAddComment = () => {
    if (!commentDraft.trim()) return
    nextCommentId.current += 1
    const newComment = {
      id: `draft-${nextCommentId.current}`,
      author: MOCK_USER.nickname,
      avatarEmoji: MOCK_USER.avatarEmoji,
      content: commentDraft.trim(),
      createdAt: TODAY,
      likeCount: 0,
      dislikeCount: 0,
      replies: [],
    }
    setComments((prev) => [...prev, newComment])
    setCommentDraft('')
  }

  const handleAddReply = (commentId) => {
    if (!replyDraft.trim()) return
    nextCommentId.current += 1
    const newReply = {
      id: `draft-reply-${nextCommentId.current}`,
      author: MOCK_USER.nickname,
      avatarEmoji: MOCK_USER.avatarEmoji,
      content: replyDraft.trim(),
      createdAt: TODAY,
      likeCount: 0,
      dislikeCount: 0,
    }
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c)),
    )
    setReplyDraft('')
    setReplyingToId(null)
  }

  const handleVote = (itemId, type) => {
    setVotes((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === type ? null : type,
    }))
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditDraft(item.content)
    setReplyingToId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleSaveEdit = (commentId, replyId = null) => {
    if (!editDraft.trim()) return
    setComments((prev) =>
      prev.map((c) => {
        if (replyId) {
          if (c.id !== commentId) return c
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === replyId ? { ...r, content: editDraft.trim(), edited: true } : r,
            ),
          }
        }
        if (c.id !== commentId) return c
        return { ...c, content: editDraft.trim(), edited: true }
      }),
    )
    setEditingId(null)
    setEditDraft('')
  }

  const handleDeleteComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const handleDeleteReply = (commentId, replyId) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) } : c)),
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
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
            mb: 4,
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '0.85rem' }} />
          커뮤니티로
        </Typography>

        <Reveal>
        <Box
          sx={{
            width: '100%',
            height: { xs: 220, sm: 320 },
            borderRadius: 3,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={photoSrc}
            alt={post.title}
            className="soft-fade-in"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        </Reveal>

        <Reveal delay={0.05}>
        <Chip label={category?.label} size="small" variant="outlined" sx={{ mb: 1.5 }} />

        <Typography variant="h1" sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 2 }}>
          {post.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Avatar
            variant="rounded"
            src={authorLevel?.iconImage}
            sx={{ width: 36, height: 34, borderRadius: '8px', fontSize: '1rem' }}
          >
            {avatarEmoji}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {post.author}
              </Typography>
              {authorLevel && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 999,
                    bgcolor: '#F3D9A8',
                    color: '#7A4A16',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    lineHeight: 1.4,
                  }}
                >
                  <span>{authorLevel.emoji}</span>
                  {authorLevel.name}
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {post.createdAt}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-line' }}>
          {post.content}
        </Typography>
        </Reveal>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            py: 2,
            mb: 4,
            borderTop: '1px solid rgba(46,42,37,0.08)',
            borderBottom: '1px solid rgba(46,42,37,0.08)',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setLiked((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: liked ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s ease, transform 0.15s ease',
              '&:hover': { color: 'primary.main' },
              '&:active': { transform: 'scale(0.9)' },
            }}
          >
            {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {displayedHeartCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {totalCommentCount}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>
          댓글 ({totalCommentCount})
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 4 }}>
          <TextField
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="댓글을 남겨보세요"
            multiline
            minRows={1}
            maxRows={4}
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!commentDraft.trim()}
            sx={{ flexShrink: 0 }}
          >
            등록
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </Typography>
          )}
          {comments.map((comment, index) => (
            <Reveal key={comment.id} delay={Math.min(index * 0.05, 0.3)}>
            <Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid rgba(46,42,37,0.08)',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                  <CommentAuthor author={comment.author} avatarEmoji={comment.avatarEmoji} createdAt={comment.createdAt} />
                </Box>

                {editingId === comment.id ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                    <TextField
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      multiline
                      minRows={1}
                      maxRows={4}
                      fullWidth
                      size="small"
                      autoFocus
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={!editDraft.trim()}
                      sx={{ flexShrink: 0 }}
                    >
                      저장
                    </Button>
                    <Button size="small" color="inherit" onClick={handleCancelEdit} sx={{ flexShrink: 0 }}>
                      취소
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {comment.content}
                      {comment.edited && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          (수정됨)
                        </Typography>
                      )}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <VoteButtons
                        itemId={comment.id}
                        likeCount={comment.likeCount}
                        dislikeCount={comment.dislikeCount}
                        vote={votes[comment.id]}
                        onVote={handleVote}
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          setReplyingToId(replyingToId === comment.id ? null : comment.id)
                          setReplyDraft('')
                        }}
                        sx={{ minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        답글 달기
                      </Button>
                      {comment.author === MOCK_USER.nickname && (
                        <>
                          <Button
                            size="small"
                            onClick={() => handleStartEdit(comment)}
                            sx={{ minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            수정
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteComment(comment.id)}
                            sx={{ minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </Box>
                  </>
                )}
              </Box>

              {comment.replies.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5, pl: { xs: 2.5, sm: 4 } }}>
                  {comment.replies.map((reply) => (
                    <Box
                      key={reply.id}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        p: 2,
                        borderRadius: 3,
                        border: '1px solid rgba(46,42,37,0.08)',
                        bgcolor: 'rgba(46,42,37,0.02)',
                      }}
                    >
                      <SubdirectoryArrowRightIcon sx={{ fontSize: '1rem', color: 'text.secondary', mt: 0.5 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <CommentAuthor author={reply.author} avatarEmoji={reply.avatarEmoji} createdAt={reply.createdAt} />

                        {editingId === reply.id ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1 }}>
                            <TextField
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              multiline
                              minRows={1}
                              maxRows={4}
                              fullWidth
                              size="small"
                              autoFocus
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSaveEdit(comment.id, reply.id)}
                              disabled={!editDraft.trim()}
                              sx={{ flexShrink: 0 }}
                            >
                              저장
                            </Button>
                            <Button size="small" color="inherit" onClick={handleCancelEdit} sx={{ flexShrink: 0 }}>
                              취소
                            </Button>
                          </Box>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                              {reply.content}
                              {reply.edited && (
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                  (수정됨)
                                </Typography>
                              )}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <VoteButtons
                                itemId={reply.id}
                                likeCount={reply.likeCount}
                                dislikeCount={reply.dislikeCount}
                                vote={votes[reply.id]}
                                onVote={handleVote}
                              />
                              {reply.author === MOCK_USER.nickname && (
                                <>
                                  <Button
                                    size="small"
                                    onClick={() => handleStartEdit(reply)}
                                    sx={{ minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    수정
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteReply(comment.id, reply.id)}
                                    sx={{ minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    삭제
                                  </Button>
                                </>
                              )}
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {replyingToId === comment.id && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 1.5, pl: { xs: 2.5, sm: 4 } }}>
                  <TextField
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder={`${comment.author}님에게 답글 남기기`}
                    multiline
                    minRows={1}
                    maxRows={4}
                    fullWidth
                    size="small"
                    autoFocus
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddReply(comment.id)}
                    disabled={!replyDraft.trim()}
                    sx={{ flexShrink: 0 }}
                  >
                    등록
                  </Button>
                </Box>
              )}
            </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Container>
  )
}

export default CommunityPostDetail
