export const HOVER_LIFT_TRANSITION = 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'

export const HOVER_LIFT_SX = {
  transition: HOVER_LIFT_TRANSITION,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(46,42,37,0.14)',
  },
}
