import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import { useLenis } from 'lenis/react'
import { DISTRICTS } from '../../constants/districts'
import { FILTER_CHIP_SX } from '../../constants/chipStyles'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { ALL_BAKERIES_SECTION_ID } from '../../constants/sectionIds'

// 히어로 바로 아래 "빵집 찾기" 바: 이름 · 메뉴 검색과 지역 필터를 한곳에 모았어요.
// 검색어나 지역을 고르면 "N곳 찾았어요" 줄이 나오고, [결과 보기]로 아래 "전체 빵집"까지 내려가요.
// 상태는 Home이 갖고 있어서 아래 목록과 항상 같은 값이에요.
//
// variant="results": "전체 빵집(검색 결과)" 제목 바로 아래에 한 번 더 놓는 재검색용 바예요.
//  - 같은 컴포넌트 · 같은 상태(검색어 · 지역)와 같은 함수를 받아서, 위아래 어느 쪽에서 바꿔도 결과가 똑같이 바뀌어요 (검색 로직은 복제하지 않아요).
//  - 이미 결과 자리에 있으니 스크롤하지 않아요: [결과 보기] 줄을 빼고, Enter는 키보드만 닫아요.
//  - 결과 개수와 [필터 초기화]는 결과 제목 줄에 이미 있어서 이 바에는 넣지 않아요.
const SCROLL_OFFSET = -100 // 고정 헤더에 가려지지 않도록

const LABELS = {
  hero: { section: '빵집 찾기', input: '빵집 이름이나 메뉴 검색', group: '지역으로 빵집 거르기' },
  results: { section: '검색 결과에서 빵집 다시 찾기', input: '빵집 이름이나 메뉴 다시 검색', group: '지역으로 검색 결과 거르기' },
}

const BakerySearchBar = ({ searchQuery, onSearchChange, selectedDistrictId, onSelectDistrict, resultCount, onReset, variant = 'hero' }) => {
  const isResults = variant === 'results'
  const labels = LABELS[isResults ? 'results' : 'hero']
  const lenis = useLenis()
  const isFiltering = Boolean(searchQuery.trim()) || Boolean(selectedDistrictId)
  const isCountKnown = typeof resultCount === 'number'

  const handleShowResults = () => {
    const target = document.getElementById(ALL_BAKERIES_SECTION_ID)
    if (!target) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (lenis) lenis.scrollTo(target, { offset: SCROLL_OFFSET, immediate: prefersReducedMotion })
    else target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    if (isResults) {
      // 결과 자리의 재검색: 이미 결과가 바로 아래에 있으니 키보드만 닫고 스크롤하지 않아요
      event.preventDefault()
      event.target.blur()
      return
    }
    if (!isFiltering) return
    event.preventDefault()
    event.target.blur() // 모바일에서는 키보드를 닫아야 결과가 보여요
    handleShowResults()
  }

  return (
    <Box
      component="section"
      aria-label={labels.section}
      sx={
        isResults
          ? { mb: { xs: 2.5, md: 3 } } // 결과 자리: 제목 아래에 그냥 놓여요 (바깥 여백은 결과 섹션의 Container가 가져요)
          : // 히어로 아래쪽에 살짝 걸쳐서, 첫 화면에서도 검색창이 보여요
            { position: 'relative', zIndex: 2, mt: { xs: -3, md: -5 }, px: { xs: 2, sm: 3 } }
      }
    >
      <Box
        sx={{
          ...PARCHMENT_SX,
          maxWidth: 860,
          mx: isResults ? 0 : 'auto', // 결과 자리: 왼쪽 제목과 줄을 맞춰요
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: { xs: '18px', md: '24px' },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.25, sm: 1.75 },
        }}
      >
        <TextField
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="빵집 이름이나 먹고 싶은 메뉴를 찾아보세요"
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              backgroundColor: 'background.paper',
              '& fieldset': { borderColor: 'parchment.edge' },
              '&:hover fieldset': { borderColor: 'mustard.main' },
              '&.Mui-focused fieldset': { borderColor: 'mustard.main', borderWidth: 2 },
            },
          }}
          slotProps={{
            htmlInput: { 'aria-label': labels.input },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* 지역 필터: 좁은 화면에서는 한 줄로 두고 가로로 넘겨요 */}
        <Box
          role="group"
          aria-label={labels.group}
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: isResults ? 'flex-start' : 'center' },
            gap: 1,
            overflowX: 'auto',
            mx: { xs: -0.5, sm: 0 },
            px: { xs: 0.5, sm: 0 },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {[{ id: null, name: '전체' }, ...DISTRICTS].map((district) => {
            const selected = (selectedDistrictId ?? null) === district.id
            return (
              <Chip
                key={district.id ?? 'all'}
                label={district.name}
                variant={selected ? 'filled' : 'outlined'}
                color={selected ? 'primary' : 'default'}
                onClick={() => onSelectDistrict(district.id)}
                sx={{ ...FILTER_CHIP_SX, flexShrink: 0, '@media (pointer: coarse)': { height: 40 } }}
              />
            )
          })}
        </Box>

        {!isResults && isFiltering && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              pt: 1.25,
              borderTop: '2px dashed',
              borderColor: 'parchment.edge',
            }}
          >
            <Typography role="status" sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.primary' }}>
              {!isCountKnown ? '빵집을 찾는 중이에요…' : resultCount === 0 ? '조건에 맞는 빵집이 없어요' : `${resultCount}곳을 찾았어요`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button size="small" onClick={onReset} sx={{ fontWeight: 700 }}>
                초기화
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleShowResults}
                disabled={!isCountKnown || resultCount === 0}
                sx={{ borderRadius: 999, px: 2 }}
              >
                결과 보기
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default BakerySearchBar
