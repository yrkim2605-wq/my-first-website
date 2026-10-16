import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import BookmarkRemoveIcon from '@mui/icons-material/BookmarkRemove'
import { BAKERIES } from '../../constants/bakeries'
import { DISTRICTS } from '../../constants/districts'
import BakeryPhoto from '../common/BakeryPhoto'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { useBookmarks } from '../../hooks/useBookmarks'
import { useBusanBakeries } from '../../hooks/useBusanBakeries'
import { RADIUS } from '../../theme'

// 마이페이지의 "찜한 빵집" 목록이에요. 찜은 나만 보는 메모라서 EXP · 도감 · 퀘스트와는 상관없어요.
// 빵집 목록(카카오)을 아직 못 불러왔거나 실패해도, 찜할 때 저장해 둔 정보로 목록을 그대로 보여줘요.
const BookmarkedBakeryList = () => {
  const { items, removeBookmark } = useBookmarks()
  const { bakeries: liveBakeries } = useBusanBakeries()

  // 지금 목록에서 찾을 수 있으면 최신 정보를, 없으면 저장해 둔 정보를 써요
  const rows = useMemo(
    () =>
      items.map((item) => {
        const live = liveBakeries.find((bakery) => String(bakery.id) === item.id) ?? BAKERIES.find((bakery) => String(bakery.id) === item.id)
        const districtName = (live && DISTRICTS.find((district) => district.id === live.districtId)?.name) || item.districtLabel
        return {
          id: item.id,
          name: live?.name ?? item.name,
          place: [districtName, live?.address ?? item.address].filter(Boolean).join(' · '),
          photoSlot: live?.photoSlot ?? item.photoSlot ?? undefined,
        }
      }),
    [items, liveBakeries],
  )

  if (rows.length === 0) {
    return (
      <Box sx={{ border: '2px dashed rgba(201,165,106,0.9)', borderRadius: RADIUS.lg, px: 3, py: 3.5, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem', wordBreak: 'keep-all' }}>
        빵집 카드의 책갈피 버튼이나 상세 페이지의 ‘찜하기’로 가고 싶은 빵집을 담아 두세요.
      </Box>
    )
  }

  return (
    <Box component="ul" aria-label="찜한 빵집" sx={{ ...PARCHMENT_SX, listStyle: 'none', m: 0, p: 0, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
      {rows.map((row) => (
        <Box
          component="li"
          key={row.id}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: { xs: 0.5, sm: 1.5 }, borderBottom: '1px solid rgba(201,165,106,0.5)', '&:last-of-type': { borderBottom: 'none' } }}
        >
          <Box
            component={Link}
            to={`/bakery/${row.id}`}
            sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.75, px: { xs: 1.5, sm: 2.5 }, py: 1.5, color: 'inherit', textDecoration: 'none', '&:hover .bookmarked-name': { color: 'primary.main' } }}
          >
            <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: RADIUS.round, overflow: 'hidden' }}>
              <BakeryPhoto bakeryId={row.id} name={row.name} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="bookmarked-name" sx={{ fontWeight: 700, transition: 'color 0.15s ease' }} noWrap>
                {row.name}
              </Typography>
              {row.place && (
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
                  {row.place}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            onClick={() => removeBookmark(row.id)}
            aria-label={`${row.name} 찜 해제`}
            size="small"
            color="primary"
            startIcon={<BookmarkRemoveIcon />}
            sx={{ flexShrink: 0, borderRadius: RADIUS.pill, minHeight: 44, px: { xs: 1, sm: 1.5 } }}
          >
            해제
          </Button>
        </Box>
      ))}
    </Box>
  )
}

export default BookmarkedBakeryList
