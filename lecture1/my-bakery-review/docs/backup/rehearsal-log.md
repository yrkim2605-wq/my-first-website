# 복구 시험 기록

> 숫자와 결과만 적어요. 개인정보(이메일 · 닉네임 · 키 · 접속 주소)는 적지 않아요.
> 실제 Supabase 회원 데이터는 사용하지 않았어요.

## 2026-10-15 · 1단계: age 암호화 · 복호화 (가짜 파일, 임시 키)

**조건:** 실제 데이터 없음 / 실제 운영 키 아님(임시 키 3개) / 외부 업로드 · 저장소 생성 없음 / 작업 위치는 OneDrive 밖(`C:\bakery-secure\rehearsal`)

| 항목 | 결과 |
|---|---|
| 설치 출처 | winget `FiloSottile.age` v1.3.2 → 공식 GitHub 릴리스 `age-v1.3.2-windows-amd64.zip` |
| 해시 확인 | winget 매니페스트 SHA256 = GitHub 릴리스 API의 digest (일치), 설치 중 "Successfully verified installer hash" |
| 설치 위치 | `%LOCALAPPDATA%\Microsoft\WinGet\Packages\FiloSottile.age_…\age\` (OneDrive 밖) |
| 시험 방식 | 가짜 덤프 2개(`public.dump`, `auth-users.dump`)를 `tar`로 묶음 → 받는 사람 2명으로 `age` 암호화 (워크플로와 같은 방식) |
| 키 2개가 서로 다른 키인지 | ✅ 공개키 `age1…` 형식 확인, 서로 다름 |
| 암호문 안에 평문이 보이는지 | ✅ 보이지 않음 (가짜 문자열 2종 검색, 헤더는 `age-encryption.org/v1`) |
| 키 1만으로 복호화 | ✅ 성공, 원본과 SHA256 일치 |
| 키 2만으로 복호화 | ✅ 성공, 원본과 SHA256 일치 |
| 관련 없는 키로 복호화 | ✅ 거부됨 (종료 코드 1, 출력 파일 없음) |
| 복호화한 묶음 내용 | ✅ `public.dump`, `auth-users.dump` 2개 |
| 정리 | ✅ `rehearsal` 폴더(임시 키 3개 · 가짜 파일 전부) 삭제 확인. 상위 폴더 `C:\bakery-secure`는 비어 있음(도구가 삭제를 막음) |

**알아낸 문제**
- `age-keygen`이 Windows에서 "world-readable" 경고를 냈어요 (폴더 접근은 내 계정만이었음). 원인 미확인 → 운영 키 생성 때 `icacls`로 확인 (README 4장).
- 처음 시도는 PowerShell 설정(`$ErrorActionPreference='Stop'`) 때문에 이 경고에서 멈췄고, 종료 코드로 판단하도록 바꿔 다시 실행했어요 (남은 파일은 가짜 · 임시여서 지우고 처음부터 재실행).

**아직 하지 않은 것:** 임시 PostgreSQL을 이용한 복구 시험(8-1), 인증 서버 로그인 시험(8-2), 실제 백업(8-3), 운영 키 생성
