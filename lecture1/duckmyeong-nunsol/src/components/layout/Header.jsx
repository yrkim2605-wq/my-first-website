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
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import logo from '../../assets/logo.png'
import { NAV_MENUS, NAV_RIGHT_MENUS } from '../../constants/siteData'

const SearchBox = ({ sx }) => (
  <Box
    sx={{
      display: 'flex',
      flex: 1,
      border: '1px solid',
      borderColor: 'primary.main',
      borderRadius: 1,
      overflow: 'hidden',
      ...sx,
    }}
  >
    <InputBase
      placeholder="제품명, 모델명, 규격을 검색해 보세요."
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
)

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleDrawerToggle = () => {
    setIsDrawerOpen((prev) => !prev)
  }

  return (
    <AppBar position="static" color="inherit" elevation={0}>
      {/* 1단: 로고 + 검색 + 로그인/회원가입/장바구니 */}
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 4 }, height: { xs: 56, md: 72 } }}>
          <IconButton onClick={handleDrawerToggle} sx={{ display: { md: 'none' } }} aria-label="메뉴 열기">
            <MenuIcon />
          </IconButton>
          <Box component="img" src={logo} alt="DMNS 덕명눈솔" sx={{ height: { xs: 28, md: 38 } }} />

          <SearchBox sx={{ display: { xs: 'none', md: 'flex' }, maxWidth: 560 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            {/* 대표번호: 작고 간결하게, 누르면 바로 전화 연결 */}
            <Box
              component="a"
              href="tel:16449879"
              aria-label="대표번호 1644-9879 전화하기"
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5,
                mr: 1,
                pr: 2,
                borderRight: '1px solid',
                borderColor: 'divider',
                fontSize: '0.875rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <PhoneOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              1644-9879
            </Box>
            <IconButton
              component="a"
              href="tel:16449879"
              aria-label="대표번호 1644-9879 전화하기"
              sx={{ display: { md: 'none' }, color: 'primary.main' }}
            >
              <PhoneOutlinedIcon />
            </IconButton>
            <Button
              startIcon={<PersonOutlinedIcon sx={{ color: 'primary.main' }} />}
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              로그인
            </Button>
            <Button
              startIcon={<PersonAddAltOutlinedIcon sx={{ color: 'primary.main' }} />}
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              회원가입
            </Button>
            <Button
              startIcon={<ShoppingCartOutlinedIcon sx={{ color: 'primary.main' }} />}
              color="inherit"
              size="small"
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              장바구니
            </Button>
            <IconButton aria-label="장바구니" sx={{ display: { md: 'none' } }}>
              <ShoppingCartOutlinedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* 모바일 검색창 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, pb: 1.5 }}>
          <SearchBox />
        </Box>
      </Container>

      {/* 2단: 검정 메뉴 바 */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, bgcolor: '#111', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', height: 48, gap: 4 }}>
            <Button
              color="inherit"
              startIcon={<MenuIcon sx={{ color: 'primary.main' }} />}
              sx={{ fontWeight: 700, px: 0 }}
            >
              전체 카테고리
            </Button>
            {NAV_MENUS.map((menu) => (
              <Typography key={menu} variant="body2" sx={{ cursor: 'pointer', fontWeight: 500 }}>
                {menu}
              </Typography>
            ))}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 3 }}>
              {NAV_RIGHT_MENUS.map((menu) => (
                <Typography key={menu} variant="body2" sx={{ cursor: 'pointer', fontWeight: 500 }}>
                  {menu}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      <Drawer anchor="left" open={isDrawerOpen} onClose={handleDrawerToggle}>
        <List sx={{ width: 240 }}>
          <ListItemButton onClick={handleDrawerToggle}>
            <ListItemText primary="전체 카테고리" slotProps={{ primary: { fontWeight: 700 } }} />
          </ListItemButton>
          {[...NAV_MENUS, ...NAV_RIGHT_MENUS].map((menu) => (
            <ListItemButton key={menu} onClick={handleDrawerToggle}>
              <ListItemText primary={menu} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </AppBar>
  )
}

export default Header
