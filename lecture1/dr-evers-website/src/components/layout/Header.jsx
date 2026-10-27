import { useState } from 'react'
import { AppBar, Box, Button, Drawer, IconButton, List, ListItemButton, ListItemText, Toolbar } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import PersonIcon from '@mui/icons-material/Person'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Logo from '../common/Logo'
import { NAV_ITEMS } from '../../constants/siteData'

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

const Header = () => {
  // 모바일 메뉴(Drawer)가 열렸는지 기억하는 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavClick = (target) => {
    scrollToSection(target)
    setIsMenuOpen(false)
  }

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: { xs: 56, md: 59 },
            px: { xs: 2, md: 6 },
            position: 'relative',
          }}
        >
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* 메뉴는 화면 가운데에 놓아요 */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 3,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.target}
                color="inherit"
                onClick={() => handleNavClick(item.target)}
                sx={{ fontSize: 17, fontWeight: 500 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, fontSize: 12, mr: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Lang <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                부산서면점 <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
              </Box>
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
              onClick={() => setIsMenuOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <List sx={{ width: 220, pt: 4 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton key={item.target} onClick={() => handleNavClick(item.target)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  )
}

export default Header
