export const HOVER_LIFT_TRANSITION = 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'

// 카드 호버: 마우스가 있는 기기에서만 살짝 떠오르고, 키보드 포커스는 어디서나 테두리로 보여요
export const HOVER_LIFT_SX = {
  transition: HOVER_LIFT_TRANSITION,
  '@media (hover: hover)': {
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 14px 28px rgba(59,42,34,0.12)',
    },
  },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 },
}
