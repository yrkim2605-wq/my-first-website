import aiMasterFace from '../../assets/project-ai-influencer.jpg';
import aiProfileSheet from '../../assets/ai-influencer-profile.jpg';
import illustrationThumb from '../../assets/project-illustration.png';

// 프로젝트 상세 페이지 내용 — 화면 구성(ProjectDetailIntro)은 같고, 여기 값만 프로젝트마다 다르다
// sheet: 전등 아래 걸리는 큰 이미지 (src가 null이면 회색 자리 표시 상자)
// master: 왼쪽 아래 작은 이미지와 이름표 — 여기서 sheet까지 선이 이어진다
// rows: ROLE / TOOL / PERIOD 처럼 왼쪽에 나열되는 정보 (lines: 한 줄씩)

// 오른쪽 01~04 표시 — isReady: 내용이 완성된 섹션만 점·화살표로 이동할 수 있다
const makeSections = (prefix) => [
  { id: `${prefix}-01`, label: '01', isReady: true },
  { id: `${prefix}-02`, label: '02', isReady: false },
  { id: `${prefix}-03`, label: '03', isReady: false },
  { id: `${prefix}-04`, label: '04', isReady: false },
];

export const PROJECT_DETAILS = {
  ai: {
    sections: makeSections('project-ai'),
    title: 'AI INFLUENCER PROJECT   X   SIWOOENT',
    description: 'AI 인플루언서를 기획하여 이미지 및 영상을 제작하여 시우이엔티 기업 인스타그램 운영 및 이커머스 판매',
    rows: [
      { label: 'ROLE', lines: ['AI Image  .  Video Generation', 'Content Creater'] },
      { label: 'TOOL', lines: ['Chat GPT  /  Seedance  /  Comfy UI', 'ElevenLabs  /  Capcut'] },
      { label: 'PERIOD', lines: ['26.08.17 - 26.10.11'] },
    ],
    persona: 'AI Persona',
    sheet: {
      src: aiProfileSheet,
      alt: 'AI 인플루언서 이서연 자기소개 — 프로필, 성격, 라이프스타일과 얼굴 특징',
    },
    master: {
      label: 'Master Face',
      src: aiMasterFace,
      alt: 'AI 인플루언서 이서연의 기준 얼굴 — 정면과 옆모습',
      captions: ['Lee seoyeon', 'AI Influencer'],
    },
  },

  // TODO: 세부 내용은 시안이 나오면 채운다 — 지금은 AI 인플루언서와 같은 구성의 자리 표시
  illustration: {
    sections: makeSections('project-illustration'),
    title: 'ILLUSTRATION ARCHIVE',
    description: 'CLIP STUDIO 를 활용해 다양한 캐릭터와 비주얼 스타일 제작',
    rows: [
      { label: 'ROLE', lines: ['Character Design', 'Illustration'] },
      { label: 'TOOL', lines: ['CLIP STUDIO'] },
      { label: 'PERIOD', lines: ['YY.MM.DD - YY.MM.DD'] },
    ],
    persona: 'Character',
    sheet: {
      src: null,
      alt: '일러스트 아카이브 대표 이미지',
    },
    master: {
      label: 'Main Character',
      src: illustrationThumb,
      alt: '거울 캐릭터 일러스트',
      captions: ['Mirror Character', 'Illustration'],
    },
  },
};
