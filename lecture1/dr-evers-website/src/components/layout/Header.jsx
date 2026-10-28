import { useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  NativeSelect,
  Toolbar,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import PersonIcon from '@mui/icons-material/Person'
import MenuIcon from '@mui/icons-material/Menu'
import logo from '../../assets/logo.png'

const NAV_ITEMS = ['이벤트', '시술전후', '의료진', '지점안내']
const LANGUAGES = ['KOR', 'ENG', 'JPN', 'CHN']
const BRANCHES = ['부산서면점']

// 청록색 바 위에서 보이도록 글자와 화살표를 흰색으로 맞춘 선택 상자 스타일
const SELECT_SX = {
  color: 'inherit',
  fontSize: 13,
  '& .MuiNativeSelect-icon': { color: 'inherit' },
  '& option': { color: 'text.primary' },
}

const Header = () => {
  // 서랍 메뉴가 열려 있는지 기억하는 상태 (처음에는 닫힘)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuOpen = () => {
    setIsMenuOpen(true)
  }
  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Box sx={{ flex: 1 }}>
          <Box component="img" src={logo} alt="Dr. Evers" sx={{ height: 36 }} />
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <Button key={item} color="inherit">
              {item}
            </Button>
          ))}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, mr: 2 }}>
            <NativeSelect defaultValue="" disableUnderline inputProps={{ 'aria-label': '언어 선택' }} sx={SELECT_SX}>
              <option value="" disabled>
                Lang
              </option>
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect defaultValue={BRANCHES[0]} disableUnderline inputProps={{ 'aria-label': '지점 선택' }} sx={SELECT_SX}>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </NativeSelect>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <IconButton color="inherit" size="small" aria-label="검색">
              <SearchIcon fontSize="small" />
            </IconButton>
            <IconButton color="inherit" size="small" aria-label="장바구니">
              <ShoppingBagOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton color="inherit" size="small" aria-label="내 정보">
              <PersonIcon fontSize="small" />
            </IconButton>
          </Box>

          <IconButton
            color="inherit"
            aria-label="메뉴 열기"
            onClick={handleMenuOpen}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer anchor="right" open={isMenuOpen} onClose={handleMenuClose}>
        <Box sx={{ width: 240 }}>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton key={item} onClick={handleMenuClose}>
                <ListItemText primary={item} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}

export default Header