import { useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import StatusMessage from '../components/common/StatusMessage'

// 없는 주소로 들어왔을 때 보여줘요 (헤더 · 푸터는 그대로 있어요). 운영자 화면에 권한 없이 들어온 경우에도 똑같이 보여줘요.
const NotFound = () => {
  const navigate = useNavigate()
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
        <StatusMessage
          mood="notfound"
          title="페이지를 찾을 수 없어요"
          description="주소가 잘못됐거나 없어진 페이지예요."
          actionLabel="첫 화면으로"
          onAction={() => navigate('/')}
        />
      </Box>
    </Container>
  )
}

export default NotFound
