import rookieIcon from '../assets/levels/rank-badge-rookie.png'
import explorerIcon from '../assets/levels/rank-badge-explorer.png'
import expertIcon from '../assets/levels/rank-badge-expert.png'
import masterIcon from '../assets/levels/rank-badge-master.png'
import otakuIcon from '../assets/levels/rank-badge-otaku.png'

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
    minVisits: 50,
    minHearts: 500,
    perk: '연간 무료 시식 패스 + 명예의 전당 등재',
  },
]
