// RPG 컨셉의 공통 sx 스타일이에요. index.css의 .wood-panel-light · .wood-panel과 같은 모양이고,
// CSS 클래스를 붙이기 어려운 곳(MUI Popover · Dialog의 종이판 등)에서 sx로 펼쳐 써요.

// 양피지 패널: 따뜻한 종이색 + 금갈색 테두리 + 안쪽 밝은 가장자리
export const PARCHMENT_SX = {
  backgroundColor: '#f9edcb',
  backgroundImage:
    'radial-gradient(ellipse at 12% 8%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(201,165,106,0.22), transparent 60%)',
  border: '2px solid #c9a56a',
  boxShadow: 'inset 0 0 0 3px rgba(255,248,225,0.7), 0 3px 0 rgba(107,68,35,0.22), 0 8px 18px rgba(51,36,25,0.08)',
  color: '#3b2a22',
}

// 나무 판자: 가로 나뭇결 + 위쪽 빛 + 어두운 테두리
export const WOOD_PLANK_SX = {
  backgroundColor: '#6b4423',
  backgroundImage:
    'repeating-linear-gradient(180deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 11px), linear-gradient(180deg, rgba(255,220,160,0.14), transparent 45%)',
  border: '2px solid #3e2713',
  boxShadow: 'inset 0 2px 0 rgba(255,220,160,0.25), 0 2px 0 rgba(33,20,10,0.35)',
  color: '#fbf6ea',
}

// 슬라이더 화살표 · 일시정지 같은 동그란 아이콘 버튼: 양피지 바탕 + 나무색 테두리 + 단단한 그림자
export const GAME_ICON_BUTTON_SX = {
  bgcolor: '#fdf6e0',
  color: '#6b4423',
  border: '2px solid #6b4423',
  boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
  flexShrink: 0,
  '&:hover': { bgcolor: '#f9edcb', boxShadow: '0 3px 0 rgba(33,20,10,0.35)' },
  '&:active': { boxShadow: '0 0 0 rgba(33,20,10,0)' },
}
