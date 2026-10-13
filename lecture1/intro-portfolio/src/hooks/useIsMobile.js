import useMediaQuery from '@mui/material/useMediaQuery';

// MUI md 브레이크포인트(900px) 미만이면 true — 화면 크기가 바뀌면 다시 그린다
// (브라우저에서만 그리는 사이트라 noSsr로 첫 화면부터 바로 맞는 값을 쓴다)
const useIsMobile = () => useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });

export default useIsMobile;
