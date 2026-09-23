export const CATEGORY_ORDER = ['Design', '콘텐츠 도구'];

export const CATEGORY_COLORS = {
  Design: '#7C6BFF',
  '콘텐츠 도구': '#4F8CFF',
};

export const initialSkills = [
  {
    id: 1,
    icon: 'photoshop',
    name: 'Photoshop',
    level: 85,
    category: 'Design',
    description: '이미지 편집과 합성을 위한 디자인 툴',
    isMainSkill: true,
  },
  {
    id: 2,
    icon: 'illustrator',
    name: 'Illustrator',
    level: 78,
    category: 'Design',
    description: '벡터 그래픽과 아이콘 제작 툴',
    isMainSkill: true,
  },
  {
    id: 3,
    icon: 'target',
    name: 'Figma',
    level: 65,
    category: 'Design',
    description: 'UI/UX 디자인 및 프로토타이핑 툴',
    isMainSkill: true,
  },
];

export const additionalSkillsCatalog = [
  { icon: 'xd', name: 'Adobe XD', level: 50, category: 'Design', description: 'UI/UX 와이어프레임 및 프로토타이핑 툴' },
  { icon: 'sketch', name: 'Sketch', level: 50, category: 'Design', description: 'macOS 기반 UI 디자인 툴' },
  { icon: 'procreate', name: 'Procreate', level: 50, category: 'Design', description: '태블릿 기반 드로잉 및 일러스트 툴' },
  { icon: 'indesign', name: 'InDesign', level: 50, category: '콘텐츠 도구', description: '인쇄물과 콘텐츠 레이아웃 제작 툴' },
  { icon: 'after-effects', name: 'After Effects', level: 50, category: '콘텐츠 도구', description: '모션 그래픽 및 영상 효과 제작 툴' },
  { icon: 'premiere', name: 'Premiere Pro', level: 50, category: '콘텐츠 도구', description: '영상 편집 및 콘텐츠 제작 툴' },
  { icon: 'canva', name: 'Canva', level: 50, category: '콘텐츠 도구', description: '간편한 SNS·콘텐츠 디자인 제작 툴' },
];

export function getSortedSkillsByLevel(skills) {
  return [...skills].sort((a, b) => b.level - a.level);
}

export function getTopSkills(skills, count) {
  return getSortedSkillsByLevel(skills).slice(0, count);
}

export function getMainSkills(skills) {
  return skills.filter((skill) => skill.isMainSkill);
}
