import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'

const PhotoUploader = ({ files, onChange }) => {
  const handleSelect = (e) => {
    const selected = Array.from(e.target.files ?? [])
    onChange([...files, ...selected])
    e.target.value = ''
  }

  const handleRemove = (index) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
        사진 추가
        <input type="file" accept="image/*" multiple hidden onChange={handleSelect} />
      </Button>

      {files.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {files.map((file, index) => (
            <Box key={index} sx={{ position: 'relative', width: 96, height: 96 }}>
              <Box
                component="img"
                src={URL.createObjectURL(file)}
                alt=""
                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemove(index)}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default PhotoUploader
