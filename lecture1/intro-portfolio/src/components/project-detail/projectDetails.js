import aiMasterFace from '../../assets/project-ai-influencer.jpg';
import aiProfileSheet from '../../assets/ai-influencer-profile.jpg';
import aiDailyLook from '../../assets/ai-influencer-daily-look.jpg';
import amuziReadingComics from '../../assets/amuzi-reading-comics.jpg';
import amuziArmchair from '../../assets/amuzi-armchair.jpg';
import amuziThunder from '../../assets/amuzi-thunder.jpg';
import bookStayAtHome from '../../assets/book-stay-at-home.jpg';
import bookFlower from '../../assets/book-flower.jpg';
import bookRabbit from '../../assets/book-rabbit.jpg';
import bookLazyAfternoon from '../../assets/book-lazy-afternoon.jpg';
import bookSwim from '../../assets/book-swim.png';
import bookWarning from '../../assets/book-warning.png';
import appleslateKeyring from '../../assets/project-appleslate-keyring.jpg';
import goodsLaptopSticker from '../../assets/goods-laptop-sticker.jpg';
import goodsLaptopSticker2 from '../../assets/goods-laptop-sticker-2.jpg';
import goodsFlatlay from '../../assets/goods-flatlay.jpg';
import goodsOutdoorKeyring from '../../assets/goods-outdoor-keyring.jpg';
import goodsIphoneSticker from '../../assets/goods-iphone-sticker.jpg';
import amuziOcean from '../../assets/amuzi-ocean.jpg';

// 프로젝트 상세 페이지 내용 — 화면 구성(ProjectDetailIntro)은 같고, 여기 값만 프로젝트마다 다르다
// sheet: 전등 아래 걸리는 큰 이미지 (src가 null이면 회색 자리 표시 상자)
// master: 왼쪽 아래 작은 이미지와 이름표 — 여기서 sheet까지 선이 이어진다
//   (images로 여러 장을 나란히 놓을 수 있고, aspect·width로 비율과 전체 너비를 바꾼다)
// rows: ROLE / TOOL / PERIOD 처럼 왼쪽에 나열되는 정보 (lines: 한 줄씩)
// gallery: 스크롤하면 나오는 02 섹션 (없으면 01 화면만 보인다)
// book: sheet 대신 01 화면 전등 아래에 넘겨 보는 책자를 건다 (pages는 짝수 장)

// 오른쪽 01~04 표시 — isReady: 내용이 완성된 섹션만 점·화살표로 이동할 수 있다
// readyCount: 앞에서부터 몇 개의 섹션이 완성됐는지
const makeSections = (prefix, readyCount = 1) => [
  { id: `${prefix}-01`, label: '01', isReady: true },
  { id: `${prefix}-02`, label: '02', isReady: readyCount >= 2 },
  { id: `${prefix}-03`, label: '03', isReady: readyCount >= 3 },
  { id: `${prefix}-04`, label: '04', isReady: readyCount >= 4 },
];

export const PROJECT_DETAILS = {
  ai: {
    key: 'ai', // 양옆 이전·다음 페이지를 고르는 이름 (pages/ProjectDetail)
    sections: makeSections('project-ai', 2),
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
    gallery: {
      label: 'Daily Look',
      heading: ['7 LOOKS', 'ONE PERSONA'],
      // TODO: 설명 문구는 원하는 내용으로 다듬는다
      description: [
        'Master Face를 기준으로 얼굴과 분위기를 유지한 채',
        '일상 속 7가지 상황에 맞춘 스타일링을 생성해',
        '어떤 콘텐츠에서도 같은 사람으로 보이게 했습니다.',
      ],
      items: ['데일리', '캠퍼스', '꾸안꾸', '데이트룩', '하객룩', '집콕룩', '여행룩'],
      image: {
        src: aiDailyLook,
        alt: '이서연의 데일리 룩 7가지 — 데일리, 캠퍼스, 꾸안꾸, 데이트룩, 하객룩, 집콕룩, 여행룩 전신과 얼굴 사진',
        aspect: '1215 / 1295',
      },
    },
  },

  illustration: {
    key: 'illustration',
    sections: makeSections('project-illustration', 2),
    title: 'ILLUSTRATION\nARCHIVE',
    // 레이아웃 — 제목을 가장 크게, 왼쪽 글 묶음은 모두 같은 너비(columnWidth)로 오른쪽 끝을 맞춘다
    titleDisplay: true,
    titleTop: 92,
    columnWidth: 340,
    lampX: 900, // 전등을 오른쪽 빈 공간 가운데로 — 책이 불빛 한가운데 걸린다
    showLink: false, // 그림 → 책으로 잇는 선은 이 프로젝트에선 빼서 불빛을 깨끗하게
    description:
      "일상의 소소한 순간을 캐릭터 '어뮤지'를 통해 레트로한 질감과 타이포, 그래픽 요소를 살린 감각적인 일러스트로 기록한 개인 프로젝트",
    rows: [
      { label: 'TOOL', lines: ['CLIP STUDIO  /  Illustrator'] },
      { label: 'PERIOD', lines: ['2022.12.25 ~ present'] },
    ],
    // 줄이 2개뿐이라 위로 붙이고, 아래 빈자리에 어뮤지 소개를 넣는다
    rowCenters: [300, 328],
    dividerY: 354,
    // 구분선 아래 캐릭터 소개 (시안: 어뮤지 상세페이지.png)
    character: {
      label: 'CHARACTER PERSONA',
      name: 'AMUZI',
      nameKo: '어뮤지',
      description: [
        '헤드셋으로 음악을 듣는 것을 좋아하고, 혼자만의 시간을 즐기는 캐릭터.',
        '느긋하게 자신만의 시간을 보내며 일상 속 다양한 순간을 함께합니다.',
      ],
    },
    master: {
      label: 'Character Drawing',
      // 정사각형 그림 두 장을 나란히 놓는다 — 흰 배경은 파일에서 책과 같은 종이색(#f1ebdf)으로 바꿔 두었다
      images: [
        { src: amuziReadingComics, alt: '헤드셋을 쓰고 엎드려 만화책을 보는 어뮤지' },
        { src: amuziArmchair, alt: '헤드셋을 쓰고 안락의자에 앉아 태블릿을 보는 어뮤지' },
      ],
      aspect: '4 / 3', // 그림 위아래 여백을 조금 잘라 낮게
      width: 341, // 왼쪽 글 묶음(25 ~ 365)과 오른쪽 끝을 맞춘다
      top: 566,
    },
    // 전등 아래 큰 이미지 자리에 넘겨 보는 책자를 건다 (ArchiveBook.jsx) — 쪽 수는 짝수여야 한다
    book: {
      spineX: 900, // 책등 x — 전등(lampX) 바로 아래, 전선이 책등에 닿는다
      top: 246, // 종이 윗변 — 표지 윗변(236)이 전선 끝에 닿는다
      page: { w: 360 }, // 한 쪽 너비 (높이는 그림 + 제목 자리로 정해진다)
      pages: [
        { src: amuziThunder, title: 'NOT TOO GOOD TODAY', alt: "먹구름과 번개 아래에서 찡그린 채 공책에 무언가를 적는 어뮤지 — 'I do not feel too good today'" },
        { src: bookStayAtHome, title: 'STAY AT HOME', alt: '베개에 기대 과자를 먹는 어뮤지 — STAY AT HOME' },
        { src: bookFlower, title: 'FLOWER', alt: "꽃밭 속에서 하늘을 올려다보는 어뮤지 — 'NO rain, NO flowers'" },
        { src: bookRabbit, title: 'LOVABLE', alt: '눈을 감고 검은 토끼들을 안고 있는 어뮤지 — Rabbit LOVABLE' },
        { src: bookLazyAfternoon, title: 'LAZY AFTERNOON', alt: '햇살 드는 침대에 엎드려 낮잠 자는 어뮤지 — LAZY AFTERNOON' },
        { src: bookSwim, title: "LET'S GO TOGETHER", alt: "헤드셋을 쓰고 구름 위를 날아가는 검은 고양이 포포 — Let's go together" },
        { src: bookWarning, title: 'WARNING', alt: '선글라스를 쓰고 풍선껌을 부는 어뮤지와 WARNING 테이프' },
        // 맺음 페이지 — 그림이 홀수 장이라 마지막 쪽을 글로 채운다
        { title: 'AMUZI', lines: ['DAILY ARCHIVE', '2022 — PRESENT'] },
      ],
    },
    // 02 화면 — 01과 같은 구성(전등 + 넘겨 보는 책자)으로, 굿즈로 태어나 일상에서 쓰이는 모습을 보여준다
    // TODO: 문구는 자리 표시 — 실제 판매 채널·수량이 정해지면 다듬는다
    second: {
      title: 'AMUZI\nGOODS',
      titleDisplay: true,
      titleTop: 92,
      columnWidth: 340,
      lampX: 970,
      showLink: false,
      description:
        '일상을 기록하던 어뮤지가 스티커와 키링 같은 실제로 만질 수 있는 굿즈로 태어나 일상 곳곳에 자리를 잡았습니다.',
      rows: [
        { label: 'PLATFORM', lines: ['NAVERPLACE'] },
        { label: 'MARKETING', lines: ['INSTAGRAM'] },
      ],
      // 설명글이 01보다 한 줄 짧아서, 01과 같은 간격이 되도록 그만큼 위로 당긴다
      rowCenters: [281, 309],
      dividerY: 335,
      // 구분선 아래 빈 공간 — 바다 버전 어뮤지 그림
      master: {
        label: 'Character Drawing',
        src: amuziOcean,
        alt: '물놀이하는 어뮤지와 포포 — 바다 컨셉의 어뮤지 캐릭터 그림',
        aspect: '1 / 1',
        width: 260, // BACK 버튼과 겹치지 않도록 01의 캐릭터 그림보다 작게
        top: 379,
      },
      book: {
        spineX: 970,
        top: 246,
        page: { w: 360 }, // 01 화면 책자와 같은 크기
        pages: [
          { src: appleslateKeyring, title: 'HAPPY SUCCESS', alt: 'APPLESLATE에서 제작한 어뮤지 캐릭터 아크릴 키링 3종 — SUCCESS, FRIEND, LUCKY' },
          { src: goodsOutdoorKeyring, title: 'OUT & ABOUT', alt: '손에 들고 야외에서 촬영한 어뮤지 키링 3종' },
          { src: goodsFlatlay, title: 'STICKER & KEYRING', alt: '어뮤지 스티커 시트와 아크릴 키링 2종을 나란히 놓은 플랫레이' },
          { src: goodsLaptopSticker, title: 'ON LAPTOP', alt: '노트북 상판과 화면 테두리에 붙인 어뮤지 스티커들' },
          { src: goodsLaptopSticker2, title: 'STICKER PACK', alt: '노트북에 붙인 곰 캐릭터, Marshall 스피커, 체크무늬 컵, 헤드셋 낀 어뮤지 스티커들' },
          { src: goodsIphoneSticker, title: 'ON IPHONE', alt: '아이폰 뒷면에 붙인 어뮤지 캐릭터 스티커' },
        ],
      },
    },
  },
};
