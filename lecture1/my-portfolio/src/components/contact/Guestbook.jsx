import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LoadingSpinner from '../LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';

const EMOJI_OPTIONS = ['😊', '💡', '❤️', '🎉', '👍', '✨'];
const REFERRAL_OPTIONS = ['검색', 'SNS', '지인 소개', '기타'];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

const Guestbook = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [emoji, setEmoji] = useState('');
  const [job, setJob] = useState('');
  const [region, setRegion] = useState('');
  const [referral, setReferral] = useState('');
  const [favoriteColor, setFavoriteColor] = useState('');
  const [keyword, setKeyword] = useState('');

  const loadEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('guestbook')
      .select('*')
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const resetForm = () => {
    setNickname('');
    setMessage('');
    setRating(0);
    setEmoji('');
    setJob('');
    setRegion('');
    setReferral('');
    setFavoriteColor('');
    setKeyword('');
    setShowMore(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('guestbook').insert({
      nickname,
      message,
      rating: rating || null,
      emoji: emoji || null,
      job: job || null,
      region: region || null,
      referral: referral || null,
      favorite_color: favoriteColor || null,
      keyword: keyword || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError('방명록 작성에 실패했습니다: ' + insertError.message);
      return;
    }
    resetForm();
    loadEntries();
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(124, 107, 255, 0.12)' : '#F1EEFF',
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Typography color="error" variant="body2">{error}</Typography>}

          <TextField
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            size="small"
            fullWidth
          />
          <TextField
            label="방명록 메시지"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            multiline
            minRows={3}
            fullWidth
          />

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Rating value={rating} onChange={(_e, v) => setRating(v)} sx={{ color: 'primary.main' }} />
            <Stack direction="row" spacing={0.5}>
              {EMOJI_OPTIONS.map((e) => (
                <Box
                  key={e}
                  onClick={() => setEmoji(emoji === e ? '' : e)}
                  sx={{
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    px: 0.7,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: emoji === e ? 'primary.main' : 'transparent',
                  }}
                >
                  {e}
                </Box>
              ))}
            </Stack>
          </Stack>

          <Button
            type="button"
            size="small"
            onClick={() => setShowMore((v) => !v)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {showMore ? '추가 정보 닫기 ▲' : '추가 정보 입력하기 (선택) ▾'}
          </Button>

          <Collapse in={showMore}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="소속/직업"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="거주 지역 (시/도)"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="어떻게 알게 되셨나요?"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  size="small"
                  fullWidth
                >
                  {REFERRAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="좋아하는 색깔"
                  value={favoriteColor}
                  onChange={(e) => setFavoriteColor(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
              <TextField
                label="한마디 키워드"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                size="small"
                fullWidth
              />
            </Stack>
          </Collapse>

          <Button type="submit" variant="contained" disabled={submitting}>
            방명록 남기기
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LoadingSpinner />
        </Box>
      ) : entries.length === 0 ? (
        <Typography color="text.secondary" align="center">
          아직 방명록이 없어요. 첫 메시지를 남겨주세요!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {entries.map((entry) => (
            <Paper key={entry.id} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {entry.emoji ? `${entry.emoji} ` : ''}
                  {entry.nickname}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(entry.created_at)}
                </Typography>
              </Stack>
              {entry.rating && (
                <Rating value={entry.rating} readOnly size="small" sx={{ mb: 0.5, color: 'primary.main' }} />
              )}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: entry.job || entry.region || entry.referral || entry.favorite_color || entry.keyword ? 1 : 0 }}>
                {entry.message}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {entry.job && <Chip size="small" label={entry.job} />}
                {entry.region && <Chip size="small" label={entry.region} />}
                {entry.referral && <Chip size="small" label={`from. ${entry.referral}`} />}
                {entry.favorite_color && <Chip size="small" label={`💛 ${entry.favorite_color}`} />}
                {entry.keyword && <Chip size="small" label={`#${entry.keyword}`} />}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default Guestbook;
