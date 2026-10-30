import { useState } from 'react'
import {
  AppBar,
  Autocomplete,
  Badge,
  Box,
  Button,
  ButtonBase,
  Container,
  IconButton,
  InputBase,
  MenuItem,
  MenuList,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import { Link as RouterLink } from 'react-router-dom'
import logo from '../../assets/logo.png'
import { CATEGORIES, NAV_MENUS, NAV_RIGHT_MENUS } from '../../constants/siteData'
import useNavAction from '../../hooks/useNavAction'
import MobileMenu from './MobileMenu'
import NavDropdown from './NavDropdown'
import useShop from '../../hooks/useShop'
import { getCategoryName, getSuggestions } from '../../utils/productSearch'

// 검색창: 입력하면 상품 제안이 뜨고, 엔터·제안 선택·돋보기 클릭으로 검색
const NAV_BUTTON_SX = { px: 0, minWidth: 0, fontWeight: 500, height: '100%', borderRadius: 0 }

const SearchBox = ({ query, onSearch, sx }) => {
  const [input, setInput] = useState(query)
  const [prevQuery, setPrevQuery] = useState(query)
  const [formElement, setFormElement] = useState(null)

  // 바깥(필터 해제 등)에서 검색어가 바뀌면 입력칸도 맞춤
  if (query !== prevQuery) {
    setPrevQuery(query)
    setInput(query)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(input)
  }

  const handleSelect = (event, value) => {
    // 제안(상품 객체)을 고른 경우만 처리: 직접 입력한 글자(문자열)는 form 제출이 처리해서 두 번 실행되지 않게 함
    if (value && typeof value === 'object') onSearch(value.name)
  }

  return (
    <Box
      component="form"
      role="search"
      ref={setFormElement}
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flex: 1,
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
        ...sx,
      }}
    >
      <Autocomplete
        freeSolo
        fullWidth
        options={getSuggestions(input)}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
        filterOptions={(options) => options}
        inputValue={input}
        onInputChange={(event, value) => setInput(value)}
        onChange={handleSelect}
        // 목록 폭을 검색창 전체 폭에 맞춤 (기본값은 입력칸 폭이라 좁아서 상품명이 잘림)
        slotProps={{
          popper: { style: { width: formElement?.clientWidth }, placement: 'bottom-start' },
          paper: { sx: { mt: 0.5, boxShadow: 4 } },
        }}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props
          return (
            <Box component="li" key={key} {...optionProps} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box component="img" src={option.image} alt="" sx={{ width: 36, height: 36, objectFit: 'contain' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getCategoryName(option.category)}
                </Typography>
              </Box>
            </Box>
          )
        }}
        renderInput={(params) => (
          <InputBase
            ref={params.slotProps.input.ref}
            inputProps={{ ...params.slotProps.htmlInput, 'aria-label': '상품 검색' }}
            placeholder="제품명, 모델명, 규격을 검색해 보세요."
            sx={{ flex: 1, px: 2, fontSize: '0.875rem', height: '100%' }}
          />
        )}
      />
      <IconButton
        type="submit"
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
}

const Header = ({ query, onSearch, onSelectCategory, onHome }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { cartCount, openCart } = useShop()
  const handleNavAction = useNavAction()

  const handleLogoClick = () => {
    onHome()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
          {/* 로고 = 홈으로 가는 링크 (이미 홈이면 필터를 풀고 맨 위로) */}
          <Box
            component={RouterLink}
            to="/"
            onClick={handleLogoClick}
            aria-label="덕명눈솔 홈으로 이동"
            sx={{ display: 'flex', flexShrink: 0 }}
          >
            <Box component="img" src={logo} alt="DMNS 덕명눈솔" sx={{ display: 'block', height: { xs: 28, md: 38 } }} />
          </Box>

          <SearchBox query={query} onSearch={onSearch} sx={{ display: { xs: 'none', md: 'flex' }, maxWidth: 560 }} />

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
              onClick={() => handleNavAction({ id: 'login', action: { type: 'soon' } })}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              로그인
            </Button>
            <Button
              startIcon={<PersonAddAltOutlinedIcon sx={{ color: 'primary.main' }} />}
              color="inherit"
              size="small"
              onClick={() => handleNavAction({ id: 'signup', action: { type: 'soon' } })}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              회원가입
            </Button>
            <Button
              startIcon={
                <Badge badgeContent={cartCount} color="primary" max={99}>
                  <ShoppingCartOutlinedIcon sx={{ color: 'primary.main' }} />
                </Badge>
              }
              color="inherit"
              size="small"
              onClick={openCart}
              aria-label={`장바구니 (${cartCount}개)`}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              장바구니
            </Button>
            <IconButton aria-label={`장바구니 (${cartCount}개)`} onClick={openCart} sx={{ display: { md: 'none' } }}>
              <Badge badgeContent={cartCount} color="primary" max={99}>
                <ShoppingCartOutlinedIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {/* 모바일 검색창 */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, pb: 1.5 }}>
          <SearchBox query={query} onSearch={onSearch} />
        </Box>
      </Container>

      {/* 2단: 검정 메뉴 바 */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, bgcolor: '#111', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box component="nav" aria-label="주 메뉴" sx={{ display: 'flex', alignItems: 'center', height: 48, gap: 4 }}>
            <NavDropdown
              label="전체 카테고리"
              startIcon={<MenuIcon sx={{ color: 'primary.main' }} />}
              buttonSx={{ fontWeight: 700 }}
              panelSx={{ width: 640, p: 2 }}
            >
              {(close) => (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                  {CATEGORIES.map((category) => (
                    <ButtonBase
                      key={category.id}
                      onClick={() => {
                        close()
                        onSelectCategory(category.id)
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.8125rem',
                        '&:hover, &:focus-visible': { bgcolor: '#FFF4ED', color: 'primary.dark' },
                      }}
                    >
                      <Box component="img" src={category.image} alt="" sx={{ width: 48, height: 48, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      {category.name}
                    </ButtonBase>
                  ))}
                </Box>
              )}
            </NavDropdown>

            {NAV_MENUS.map((menu) =>
              menu.children ? (
                <NavDropdown key={menu.id} label={menu.label}>
                  {(close) => (
                    <MenuList>
                      {menu.children.map((child) => (
                        <MenuItem
                          key={child.id}
                          onClick={() => {
                            close()
                            handleNavAction(child)
                          }}
                        >
                          {child.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  )}
                </NavDropdown>
              ) : (
                <Button key={menu.id} color="inherit" onClick={() => handleNavAction(menu)} sx={NAV_BUTTON_SX}>
                  {menu.label}
                </Button>
              ),
            )}

            <Box sx={{ ml: 'auto', display: 'flex', gap: 3, height: '100%' }}>
              {NAV_RIGHT_MENUS.map((menu) => (
                <Button key={menu.id} color="inherit" onClick={() => handleNavAction(menu)} sx={NAV_BUTTON_SX}>
                  {menu.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      <MobileMenu
        open={isDrawerOpen}
        onClose={handleDrawerToggle}
        onSelectCategory={onSelectCategory}
        onSelectItem={handleNavAction}
      />
    </AppBar>
  )
}

export default Header
