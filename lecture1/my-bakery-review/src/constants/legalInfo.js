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
  operatorName: '', // 운영자(개인 또는 사업자) 이름
  contactEmail: '', // 문의 · 신고 · 개인정보 요청을 받을 이메일
  privacyOfficer: '', // 개인정보 보호책임자 (이름과 연락처)
  effectiveDate: '', // 시행일 (예: 2026년 11월 1일)
  dataRegion: '', // Supabase 프로젝트의 데이터 저장 지역 (대시보드 Project Settings에서 확인)
  mailProvider: '', // 인증 · 재설정 메일 발송 서비스 (Custom SMTP를 정한 뒤)
  minimumAge: '', // 가입 가능한 최소 나이 (예: 만 14세 이상 가입 제한 여부)
  logRetention: '', // 접속 기록 · 서버 로그 보관 기간 (Supabase 설정 확인 후)
  backupRetention: '', // 백업본에 탈퇴한 사용자의 정보가 남는 기간
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
  minimumAge: '가입 가능 최소 나이',
  logRetention: '접속 기록 보관 기간',
  backupRetention: '백업 보관 기간',
  jurisdiction: '관할 법원',
}

export const getPendingLegalKeys = (info = LEGAL_INFO) => Object.keys(LEGAL_INFO_LABELS).filter((key) => !String(info[key] ?? '').trim())
