import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { heroIntroSx } from '../constants/decor';

const NAV_ITEMS = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#skills' }, // 세 번째 섹션(Skills)으로 이동
  { label: 'PROJECTS', href: '#projects' },
  { label: 'CONTACT', href: '#contact' },
];

// linkPrefix: 다른 페이지(예: 자기소개)에서 쓸 때 메인 페이지 주소를 앞에 붙여 메인의 각 섹션으로 돌아가게 한다
// intro: 메인 페이지에서 히어로 첫 등장 연출과 함께 위에서 내려온다
const Header = ({ linkPrefix = '', intro = false }) => {
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        mixBlendMode: 'difference',
        transform: 'translateY(5px)',
        py: { xs: 1, md: 0.5 },
        lineHeight: 1,
        px: { xs: 2, md: 3 },
        ...(intro && heroIntroSx('heroDropIn', 1.1, 0.9)),
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography
          component="a"
          href={`${linkPrefix}#home`}
          sx={{
            fontFamily: '"Stick No Bills", sans-serif',
            fontWeight: 800,
            fontSize: { xs: 14, md: 20 },
            letterSpacing: '0.27em',
            lineHeight: 1,
            color: '#ffffff',
            textDecoration: 'none',
          }}
        >
          IDEAMADE
        </Typography>
        <Stack
          component="nav"
          aria-label="주요 메뉴"
          direction="row"
          // 모바일에서도 메뉴를 숨기지 않고 간격·글자만 줄여 보여 준다
          spacing={{ xs: 2, sm: 4, md: 8 }}
        >
          {NAV_ITEMS.map((item) => (
            <Typography
              key={item.label}
              component="a"
              href={`${linkPrefix}${item.href}`}
              sx={{
                position: 'relative',
                fontFamily: '"Alumni Sans", sans-serif',
                fontWeight: 600,
                fontSize: { xs: 15, md: 20 },
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: '#ffffff',
                textDecoration: 'none',
                // 마우스를 올리면 밑줄이 왼쪽에서부터 그어진다
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '-0.25em',
                  height: '1px',
                  bgcolor: 'currentColor',
                  transform: 'scaleX(0)',
                  transformOrigin: 'right',
                  transition: 'transform 0.35s ease',
                },
                '&:hover::after, &:focus-visible::after': { transform: 'scaleX(1)', transformOrigin: 'left' },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default Header;
