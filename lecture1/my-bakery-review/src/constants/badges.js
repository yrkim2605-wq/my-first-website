import saltBreadManiaIcon from '../assets/badges/badge-salt-bread-mania.webp'
import croissantHunterIcon from '../assets/badges/badge-croissant-hunter.webp'
import strawberrySeasonIcon from '../assets/badges/badge-strawberry-season.webp'
import bread100Icon from '../assets/badges/badge-bread-100.webp'
import earlyBirdIcon from '../assets/badges/badge-early-bird.webp'

// 배지는 저장된 모험 일지로 확인할 수 있는 조건만 써요 (utils/badgeRules.js가 판정해요).
// rule.type
//   'keyword'    : 일지 내용에 keyword가 들어간 일지가 target개 이상
//   'discovered' : 빵집 도감에서 발견한 빵집이 target곳 이상
export const BADGES = [
  {
    id: 'salt-bread-mania',
    name: '소금빵 마니아',
    emoji: '🧂',
    iconImage: saltBreadManiaIcon,
    description: '일지에 "소금빵"을 언급한 일지 10개',
    rule: { type: 'keyword', keyword: '소금빵', target: 10 },
  },
  {
    id: 'croissant-hunter',
    name: '크루아상 헌터',
    emoji: '🥐',
    iconImage: croissantHunterIcon,
    description: '일지에 "크루아상"을 언급한 일지 5개',
    rule: { type: 'keyword', keyword: '크루아상', target: 5 },
  },
  {
    id: 'strawberry-season',
    name: '딸기 시즌 정복자',
    emoji: '🍓',
    iconImage: strawberrySeasonIcon,
    description: '일지에 "딸기"를 언급한 일지 3개',
    rule: { type: 'keyword', keyword: '딸기', target: 3 },
  },
  {
    id: 'early-bird',
    name: '새벽 오픈런 마니아',
    emoji: '🌅',
    iconImage: earlyBirdIcon,
    description: '일지에 "오픈런"을 언급한 일지 5개',
    rule: { type: 'keyword', keyword: '오픈런', target: 5 },
  },
  {
    id: 'legend-conqueror',
    name: '전설의 빵집 정복자',
    emoji: '💥',
    iconImage: bread100Icon,
    description: '빵집 도감에서 빵집 50곳 발견 (한 번 발견하면 유지돼요)',
    rule: { type: 'discovered', target: 50 },
  },
]
