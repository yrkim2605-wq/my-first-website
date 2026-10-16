import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
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
//  - 이미 결과 자리에 있으니 스크롤하지 않아요: [결과 보기] 줄을 빼고, Enter와 [검색] 버튼은 키보드만 닫아요.
//  - 결과 개수와 [필터 초기화]는 결과 제목 줄에 이미 있어서 이 바에는 넣지 않아요.
//  - 배치: 카드 그리드와 같은 너비. 첫 줄에 넓은 검색 입력창 + 와인색 [검색] 버튼, 둘째 줄에 지역 칩(PC는 오른쪽 정렬, 폰은 왼쪽부터 가로 스크롤).
//  - 검색은 입력하는 즉시 반영돼요(기존 그대로). [검색] 버튼은 "검색을 마쳤어요" 신호로, 폰에서 키보드를 닫아 결과를 바로 보게 해 줘요.
const SCROLL_OFFSET = -100 // 고정 헤더에 가려지지 않도록

// placeholder: 위쪽은 "탐험을 시작하는" 느낌, 결과 쪽은 "결과를 다시 찾는" 느낌으로 구분해요 (좁은 폰에서도 한 줄에 들어오게 짧게)
// narrowPlaceholder: 검색 버튼이 옆에 있어 입력칸이 좁아지는 폰(420px 미만)에서 쓰는 더 짧은 문구
const LABELS = {
  hero: { section: '빵집 찾기', input: '빵집 이름이나 메뉴 검색', group: '지역으로 빵집 거르기', placeholder: '오늘은 어떤 빵집을 탐험할까요?' },
  results: {
    section: '검색 결과에서 빵집 다시 찾기',
    input: '빵집 이름이나 메뉴 다시 검색',
    group: '지역으로 검색 결과 거르기',
    placeholder: '다른 빵집 · 메뉴로 다시 찾아보기',
    narrowPlaceholder: '다시 찾아보기',
  },
}
const NARROW_PHONE_QUERY = '(max-width:419px)'

const BakerySearchBar = ({ searchQuery, onSearchChange, selectedDistrictId, onSelectDistrict, resultCount, onReset, variant = 'hero' }) => {
  const isResults = variant === 'results'
  const labels = LABELS[isResults ? 'results' : 'hero']
  const lenis = useLenis()
  const isNarrowPhone = useMediaQuery(NARROW_PHONE_QUERY)
  const placeholder = isResults && isNarrowPhone ? labels.narrowPlaceholder : labels.placeholder
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

  // [검색] 버튼(결과 쪽): 검색은 이미 반영돼 있으니 키보드만 닫아요. 스크롤하지 않아요.
  const handleSubmit = (event) => {
    event.preventDefault()
    document.activeElement?.blur?.()
  }

  const searchField = (
    <TextField
      value={searchQuery}
      onChange={onSearchChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      variant="outlined"
      fullWidth
      sx={{
        ...(isResults && { flex: 1, minWidth: 0 }),
        // 안내 문구는 폰에서 살짝 작게: 320px에서도 한 줄에 다 들어와요
        '& .MuiOutlinedInput-input::placeholder': { fontSize: isResults ? { xs: '0.9rem', md: '1.05rem' } : { xs: '0.9rem', sm: '1rem' } },
        // 결과 쪽은 주요 기능이라 글자를 조금 키우고 테두리를 한 단계 굵게 해요
        ...(isResults && { '& .MuiOutlinedInput-input': { fontSize: { md: '1.05rem' } } }),
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
          backgroundColor: 'background.paper',
          '& fieldset': { borderColor: 'parchment.edge', ...(isResults && { borderWidth: 2 }) },
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
  )

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
        // 결과 쪽은 form(role=search)이라 Enter · [검색] 버튼 모두 같은 처리예요
        component={isResults ? 'form' : 'div'}
        role={isResults ? 'search' : undefined}
        onSubmit={isResults ? handleSubmit : undefined}
        noValidate={isResults ? true : undefined}
        sx={{
          ...PARCHMENT_SX,
          maxWidth: isResults ? { xs: 860, md: 'none' } : 860, // 결과 자리: PC에서는 카드 그리드와 같은 너비
          mx: isResults ? 0 : 'auto', // 결과 자리: 왼쪽 제목과 줄을 맞춰요
          p: isResults ? { xs: 1.5, md: 1.75 } : { xs: 1.5, sm: 2.5 }, // 결과 쪽은 PC에서 높이를 줄이려고 조금 더 촘촘하게
          borderRadius: { xs: '18px', md: '24px' },
          display: 'flex',
          flexDirection: 'column',
          gap: isResults ? 1.25 : { xs: 1.25, sm: 1.75 },
        }}
      >
        {isResults ? (
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: { xs: 0.75, md: 1.25 } }}>
            {searchField}
            {/* 주요 행동 버튼: 와인색 꽉 찬 버튼 + 돋보기 + "검색". 지역 칩(테두리 칩)보다 확실히 크고 진해요 */}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              sx={{
                flexShrink: 0,
                minWidth: { xs: 84, md: 128 },
                px: { xs: 1.75, md: 3.5 },
                borderRadius: 999,
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 3px 0 rgba(90,31,42,0.55)',
                '&:hover': { boxShadow: '0 4px 0 rgba(90,31,42,0.55)' },
                '&:active': { transform: 'translateY(2px)', boxShadow: '0 1px 0 rgba(90,31,42,0.55)' },
              }}
            >
              검색
            </Button>
          </Box>
        ) : (
          searchField
        )}

        {/* 지역 필터: 좁은 화면에서는 한 줄로 두고 가로로 넘겨요 */}
        <Box
          role="group"
          aria-label={labels.group}
          sx={{
            display: 'flex',
            // 결과 쪽: PC는 오른쪽 정렬(검색창 아래), 폰은 왼쪽부터. 위쪽 바는 기존 그대로 (폰 왼쪽, 그 위 가운데)
            justifyContent: isResults ? { xs: 'flex-start', md: 'flex-end' } : { xs: 'flex-start', sm: 'center' },
            gap: 1,
            // 결과 자리의 PC: 칩이 한 줄에 다 안 들어가면 줄바꿈 (폰은 가로로 넘겨요)
            overflowX: isResults ? { xs: 'auto', md: 'visible' } : 'auto',
            flexWrap: isResults ? { xs: 'nowrap', md: 'wrap' } : 'nowrap',
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
