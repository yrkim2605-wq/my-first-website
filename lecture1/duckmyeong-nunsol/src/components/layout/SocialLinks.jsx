import { Box, IconButton } from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import YouTubeIcon from '@mui/icons-material/YouTube'
import InstagramIcon from '@mui/icons-material/Instagram'
import PinterestIcon from '@mui/icons-material/Pinterest'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import { SOCIAL_LINKS } from '../../constants/siteData'

// 전용 아이콘이 없는 서비스(구글+, 밴드)는 글자로 표시
const textStyle = { fontWeight: 700, lineHeight: 1, fontFamily: 'Arial, sans-serif' }

const ICONS = {
  facebook: <FacebookIcon fontSize="small" />,
  twitter: <TwitterIcon fontSize="small" />,
  googleplus: <Box component="span" sx={{ ...textStyle, fontSize: '0.9375rem' }}>g+</Box>,
  youtube: <YouTubeIcon fontSize="small" />,
  instagram: <InstagramIcon fontSize="small" />,
  band: <Box component="span" sx={{ ...textStyle, fontSize: '0.5625rem', letterSpacing: 0.3 }}>BAND</Box>,
  kakaostory: <ChatBubbleIcon fontSize="small" />,
  pinterest: <PinterestIcon fontSize="small" />,
}

// 푸터의 SNS 바로가기 아이콘 (서비스 대표 색상)
const SocialLinks = () => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {SOCIAL_LINKS.map(({ id, label, bgcolor, color }) => (
        <IconButton
          key={id}
          aria-label={label}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 0.5,
            bgcolor,
            color,
            '&:hover': { bgcolor, filter: 'brightness(0.9)' },
          }}
        >
          {ICONS[id]}
        </IconButton>
      ))}
    </Box>
  )
}

export default SocialLinks
