import Box from '@mui/material/Box'
import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <Box id="top">
      <Header />
      {children}
      <Footer />
    </Box>
  )
}

export default Layout
