// 레벨 프로필 이미지: Lv.1~Lv.5 메달 (빵린이 → 빵덕후 순서)
import rookieIcon from '../assets/levels/level-medal-1.webp'
import explorerIcon from '../assets/levels/level-medal-2.webp'
import expertIcon from '../assets/levels/level-medal-3.webp'
import masterIcon from '../assets/levels/level-medal-4.webp'
import otakuIcon from '../assets/levels/level-medal-5.webp'

export const LEVELS = [
  {
    id: 'rookie',
    name: '빵린이',
    emoji: '🐣',
    iconImage: rookieIcon,
    minVisits: 0,
    minHearts: 0,
    perk: '전 매장 아메리카노 사이즈업 쿠폰',
  },
  {
    id: 'explorer',
    name: '빵탐험가',
    emoji: '🧭',
    iconImage: explorerIcon,
    minVisits: 5,
    minHearts: 0,
    perk: '빵집 지도 확장 + 신메뉴 알림',
  },
  {
    id: 'expert',
    name: '빵전문가',
    emoji: '🎓',
    iconImage: expertIcon,
    minVisits: 15,
    minHearts: 100,
    perk: '무료 시식 티켓 1매',
  },
  {
    id: 'master',
    name: '빵마스터',
    emoji: '👑',
    iconImage: masterIcon,
    minVisits: 30,
    minHearts: 300,
    perk: '전 매장 10% 할인 쿠폰',
  },
  {
    id: 'otaku',
    name: '빵덕후',
    emoji: '🏆',
    iconImage: otakuIcon,
    // 왕관 · 월계관 때문에 같은 칸에서 메달 본체가 작아 보여서, 화면에서 조금 더 크게 그려요
    iconScale: 1.08,
    minVisits: 50,
    minHearts: 500,
    perk: '연간 무료 시식 패스 + 명예의 전당 등재',
  },
]
