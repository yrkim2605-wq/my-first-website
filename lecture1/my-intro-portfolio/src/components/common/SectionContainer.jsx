import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

const SectionContainer = ({ id, children, sx }) => {
  return (
    <Box id={id} component="section" sx={{ py: 8, ...sx }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  )
}

export default SectionContainer
