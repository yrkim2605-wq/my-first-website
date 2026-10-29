import { useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import logo from '../../assets/logo.png'
import { NAV_MENUS } from '../../constants/siteData'

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleDrawerToggle = () => {
    setIsDrawerOpen((prev) => !prev)
  }

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        {/* 1단: 로고 + 검색 + 아이콘 */}
        <Toolbar disableGutters sx={{ gap: 3, minHeight: { xs: 56, md: 64 } }}>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' } }}
            aria-label="메뉴 열기"
          >
            <MenuIcon />
          </IconButton>
          <Box component="img" src={logo} alt="DMNS 덕명눈솔" sx={{ height: { xs: 28, md: 36 } }} />

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flex: 1,
              maxWidth: 520,
              mx: 'auto',
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <InputBase
              placeholder="제품명, 모델명, 규격을 입력하세요."
              sx={{ flex: 1, px: 2, fontSize: '0.875rem' }}
            />
            <IconButton
              aria-label="검색"
              sx={{
                bgcolor: 'primary.main',
                color: '#fff',
                borderRadius: 0,
                px: 1.5,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <SearchIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <Button
              startIcon={<PersonOutlinedIcon />}
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              로그인
            </Button>
            <IconButton aria-label="찜" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              <FavoriteBorderIcon />
            </IconButton>
            <IconButton aria-label="장바구니">
              <ShoppingCartOutlinedIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {/* 2단: 메뉴 */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            height: 48,
            gap: 5,
          }}
        >
          <Button
            color="inherit"
            startIcon={<MenuIcon sx={{ color: 'primary.main' }} />}
            sx={{ fontWeight: 700 }}
          >
            전체 카테고리
          </Button>
          {NAV_MENUS.map((menu) => (
            <Typography key={menu} variant="body2" sx={{ cursor: 'pointer', fontWeight: 500 }}>
              {menu}
            </Typography>
          ))}
          <Typography
            variant="body2"
            sx={{ ml: 'auto', color: 'primary.main', fontWeight: 700, cursor: 'pointer' }}
          >
            견적문의
          </Typography>
        </Box>
      </Container>

      <Drawer anchor="left" open={isDrawerOpen} onClose={handleDrawerToggle}>
        <List sx={{ width: 240 }}>
          <ListItemButton onClick={handleDrawerToggle}>
            <ListItemText primary="전체 카테고리" />
          </ListItemButton>
          {NAV_MENUS.map((menu) => (
            <ListItemButton key={menu} onClick={handleDrawerToggle}>
              <ListItemText primary={menu} />
            </ListItemButton>
          ))}
          <ListItemButton onClick={handleDrawerToggle}>
            <ListItemText
              primary="견적문의"
              slotProps={{ primary: { color: 'primary', fontWeight: 700 } }}
            />
          </ListItemButton>
        </List>
      </Drawer>
    </AppBar>
  )
}

export default Header
