import { useState } from 'react'
import { Box, Button, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemText } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import logo from '../../assets/logo.png'
import { CATEGORIES, COMPANY_INFO, NAV_MENUS, NAV_RIGHT_MENUS } from '../../constants/siteData'

const CATEGORY_SECTION_ID = 'categories'

// 펼칠 수 있는 한 줄 (제목을 누르면 하위 항목이 열림)
const ExpandableItem = ({ id, label, isOpen, onToggle, children }) => (
  <>
    <ListItemButton onClick={() => onToggle(id)} aria-expanded={isOpen}>
      <ListItemText primary={label} slotProps={{ primary: { fontWeight: 700 } }} />
      {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </ListItemButton>
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <List disablePadding sx={{ bgcolor: '#F7F7F8' }}>
        {children}
      </List>
    </Collapse>
  </>
)

// 모바일 전체 메뉴: 카테고리 / 메뉴(하위 메뉴 접기·펼치기) / 로그인·회원가입 / 전화
const MobileMenu = ({ open, onClose, onSelectCategory, onSelectItem }) => {
  const [openId, setOpenId] = useState(CATEGORY_SECTION_ID)

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const handleCategory = (categoryId) => {
    onClose()
    onSelectCategory(categoryId)
  }

  const handleItem = (item) => {
    onClose()
    onSelectItem(item)
  }

  const renderItem = (item, { isSub = false } = {}) => (
    <ListItemButton key={item.id} onClick={() => handleItem(item)} sx={{ pl: isSub ? 4 : 2 }}>
      <ListItemText primary={item.label} slotProps={{ primary: { fontWeight: isSub ? 400 : 700, fontSize: isSub ? '0.9375rem' : undefined } }} />
    </ListItemButton>
  )

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 'min(300px, 85vw)' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, height: 56, flexShrink: 0 }}>
        <Box component="img" src={logo} alt="DMNS 덕명눈솔" sx={{ height: 26 }} />
        <IconButton aria-label="메뉴 닫기" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List disablePadding component="nav" aria-label="전체 메뉴">
          <ExpandableItem id={CATEGORY_SECTION_ID} label="전체 카테고리" isOpen={openId === CATEGORY_SECTION_ID} onToggle={handleToggle}>
            {CATEGORIES.map((category) => (
              <ListItemButton key={category.id} onClick={() => handleCategory(category.id)} sx={{ pl: 2, gap: 1.5 }}>
                <Box component="img" src={category.image} alt="" sx={{ width: 32, height: 32, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                <ListItemText primary={category.name} slotProps={{ primary: { fontSize: '0.9375rem' } }} />
              </ListItemButton>
            ))}
          </ExpandableItem>
          <Divider />

          {NAV_MENUS.map((menu) =>
            menu.children ? (
              <ExpandableItem key={menu.id} id={menu.id} label={menu.label} isOpen={openId === menu.id} onToggle={handleToggle}>
                {menu.children.map((child) => renderItem(child, { isSub: true }))}
              </ExpandableItem>
            ) : (
              renderItem(menu)
            ),
          )}
          <Divider />
          {NAV_RIGHT_MENUS.map((menu) => renderItem(menu))}
        </List>
      </Box>

      <Box sx={{ p: 2, display: 'grid', gap: 1, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => handleItem({ id: 'login', action: { type: 'soon' } })}>
            로그인
          </Button>
          <Button variant="outlined" color="inherit" onClick={() => handleItem({ id: 'signup', action: { type: 'soon' } })}>
            회원가입
          </Button>
        </Box>
        <Button
          component="a"
          href={`tel:${COMPANY_INFO.tel.replace(/-/g, '')}`}
          variant="contained"
          startIcon={<PhoneOutlinedIcon />}
        >
          {COMPANY_INFO.tel} 전화 상담
        </Button>
      </Box>
    </Drawer>
  )
}

export default MobileMenu
