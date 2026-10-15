// 개인정보처리방침 · 이용약관에 들어가는 "운영자가 정해야 하는 정보"예요.
// ⚠️ 확정되지 않은 값은 절대 임의로 채우지 않아요. 빈 문자열('')이면 문서에 "[확인 필요: …]"로 눈에 띄게 표시돼요.
//    운영자가 값을 정하면 아래 빈 문자열만 채우면 돼요 (문서 본문은 legalDocs.js).

// 문서 버전: 약관을 바꾸면 이 값도 바꿔요. 가입할 때 "어느 버전에 동의했는지"가 계정에 기록돼요.
export const LEGAL_VERSION = '2026-10-draft1'

export const LEGAL_INFO = {
  // ── 이미 정해진 값 ──
  serviceName: '빵덕후 레벨업',
  serviceUrl: 'https://yrkim2605-wq.github.io/my-first-website/my-bakery-review/',

  // ── 운영자가 확인해서 채울 값 (빈 칸 = 확인 필요) ──
  operatorName: '빵덕후 레벨업 (사업자등록 없는 개인 프로젝트, 무료 서비스)', // 운영자(개인 또는 사업자) 이름
  contactEmail: 'bbanglevelup@gmail.com', // 문의 · 신고 · 개인정보 요청을 받을 이메일
  privacyOfficer: '김유리 (bbanglevelup@gmail.com)', // 개인정보 보호책임자 (이름과 연락처)
  effectiveDate: '2026년 11월 1일', // 시행일 — 베타 공개 일정이 바뀌면 이 값만 고치면 돼요 (방침 · 약관에 자동 반영)
  dataRegion: '대한민국 서울 (Supabase 주 데이터베이스, ap-northeast-2)', // Supabase 대시보드에서 확인 (2026-10-15). 데이터베이스 위치만이에요 — 외부 서비스 위치와 섞지 않아요
  mailProvider: 'Brevo', // 인증 · 재설정 메일 발송 서비스 (Custom SMTP를 정한 뒤)
  mailProviderRegion: '', // 메일 발송 서비스가 메일 주소를 처리하는 서버 위치 (Brevo 공식 문서 · 계정 설정에서 확인)
  minimumAge: '', // 가입 가능한 최소 나이 (예: 만 14세 이상 가입 제한 여부)
  logRetention: '약 1일 (Supabase 무료 플랜 기준이며, 인증 관련 기록은 약 1시간이에요. 플랜이 바뀌면 달라질 수 있어요)', // Supabase Free 플랜 공식 문서 기준(2026-10-15, 플랜은 사용자 확인). 메일 서비스(Brevo)의 발송 기록은 포함하지 않아요
  backupRetention: '', // 백업본에 탈퇴한 사용자의 정보가 남는 기간
  reportRetention: '', // 처리가 끝난 신고 기록을 보관하는 기간
  jurisdiction: '', // 분쟁이 생겼을 때의 관할 법원
}

// 화면에 보여줄 "확인 필요" 이름표
export const LEGAL_INFO_LABELS = {
  operatorName: '운영자 이름',
  contactEmail: '문의 이메일',
  privacyOfficer: '개인정보 보호책임자',
  effectiveDate: '시행일',
  dataRegion: '데이터 저장 지역',
  mailProvider: '메일 발송 서비스',
  mailProviderRegion: '메일 발송 서비스 처리 위치',
  minimumAge: '가입 가능 최소 나이',
  logRetention: '접속 기록 보관 기간',
  backupRetention: '백업 보관 기간',
  reportRetention: '신고 기록 보관 기간',
  jurisdiction: '관할 법원',
}

export const getPendingLegalKeys = (info = LEGAL_INFO) => Object.keys(LEGAL_INFO_LABELS).filter((key) => !String(info[key] ?? '').trim())
