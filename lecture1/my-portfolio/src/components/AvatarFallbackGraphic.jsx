import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

function AvatarFallbackGraphic({ size = 48 }) {
  return <PersonRoundedIcon sx={{ fontSize: size, color: '#FFFFFF' }} />;
}

export default AvatarFallbackGraphic;
