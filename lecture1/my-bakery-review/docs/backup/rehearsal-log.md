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

## 2026-10-15 · 2단계: EDB 서명 설치 프로그램 `--extract-only 1` 추출 (실제 회원 데이터 없음)

**실행:** 최소 옵션 `--extract-only 1 --prefix C:\bakery-secure\pg\edb`, 대화형(마법사), UAC는 사용자가 직접 승인(게시자 확인), 마법사는 사용자가 Finish까지 진행. 실행 전 설치 프로그램 SHA256 · 서명(`EnterpriseDB Corporation`, 지문 일치) 재확인 통과, `before` 스냅샷 저장. **서버 시작 · DB 생성 · 복구 시험은 하지 않았어요.**

| 항목 | 결과 |
|---|---|
| 추출 위치 | `C:\bakery-secure\pg\edb` (OneDrive 밖), 파일 20,675개 · 약 998MB. 최상위: `bin` `doc` `include` `installer` `lib` `pgAdmin 4` `scripts` `share` + 라이선스 txt. (`StackBuilder` 폴더는 없음 = 마법사에서 해제한 것으로 보임) |
| 전체 설치가 아닌가 | 서비스 · 계정 · 방화벽 · 레지스트리(설치 목록 3곳, `PostgreSQL` 키 4곳, 서비스 키 790개) · PATH · 열린 포트 · 예약 작업 · 프로세스 · 시작 메뉴 · `C:\Program Files\PostgreSQL` **전부 변화 없음** → 추출만 된 것으로 판단 |
| 스냅샷 비교 (`before` 2,156줄 / `after` 2,172줄) | 차이 20줄 = `C:\bakery-secure` 아래 새 폴더 · 파일(추출 결과, `before.txt`, `work` 폴더) + Windows 서비스 `wlidsvc`(Microsoft 계정 로그인 도우미)가 Stopped→Running, `wuauserv`(Windows Update)가 Running→Stopped. 두 서비스는 이름 · 경로 · 시작 유형이 같고 PostgreSQL과 무관하며 **원인은 확인하지 못했어요**(이 시간대 System 로그에 서비스 이벤트 없음) |
| 이벤트 로그 | `MsiInstaller` 이벤트 없음(런타임 설치 안 됨), 새 서비스 설치 이벤트 없음, 사용자 계정 생성 이벤트 없음 |
| zip과 해시 비교 | 같은 경로 20,473개 **전부 동일**, **내용이 다른 파일 0개**. 핵심 6개(`postgres` `initdb` `pg_ctl` `psql` `pg_dump` `pg_restore`)도 동일. 추출에만 있음 202개(번역 `share\locale` 166 · `share\i18n` 17 · `share\extension` 6 · `installer` 6 · `scripts` 6 · `doc` 1), zip에만 있음 16개(`StackBuilder` 14 + `include` 2) |
| 서명 | 추출된 핵심 6개 모두 `NotSigned` (zip과 같음. 서명은 설치 프로그램 파일 전체에 걸려 있음) → **서명된 설치 프로그램에서 나온 파일이 zip과 같다는 것까지 확인**됨 |
| 실행 중인 것 | PostgreSQL 관련 프로세스 0, 5432 · 54329 포트 리스닝 없음, PostgreSQL 서비스 0 |
| 폴더 권한 | `edb` 폴더 접근은 내 계정(`USER`)만 (상위 폴더에서 상속) |

**새로 생긴 주의할 파일 (실행하지 않았어요):** `installer\vcredist_x64.exe` · `vcredist_x86.exe`(런타임 설치 프로그램), `installer\server\createuser.exe` · `validateuser.exe` · `initcluster.ps1` · `getlocales.ps1`(전체 설치 때 서비스 계정을 만들고 클러스터를 초기화하는 도우미), `scripts\runpsql.bat` 등. **이 파일들은 실행하지 않아요.** 서버가 필요하면 `bin\initdb.exe` · `bin\pg_ctl.exe`를 직접 쓰는 계획이에요(별도 승인).

## 2026-10-15 · 3단계(관문 A): 빈 클러스터 초기화 + 로컬 인증 설정 (서버는 시작하지 않음, 가짜 데이터 없음)

**승인 범위:** 임의 비밀번호 생성 · `initdb` · 로컬 인증 설정까지. 서버 시작(`pg_ctl start`) · DB 생성 · 가짜 데이터 · 복구 시험은 하지 않았어요.

| 항목 | 결과 |
|---|---|
| 사전 점검 | 핵심 실행 파일 6개 해시 기록과 동일, 관리자(올린 권한) 세션 아님, `PG*`/`DATABASE_URL`/`SUPABASE*` 환경변수 0개, 54329 포트 비어 있음, PostgreSQL 프로세스 0개, `data`/`logs`/`secrets` 아직 없음 — 모두 통과. 시작 전 스냅샷 `before-server.txt` 저장 |
| 비밀번호 | 암호학적 난수로 24자 생성 → `pg\secrets\pg-test-pw.txt`(24바이트). **화면 · 로그 · Git · 문서에 값을 남기지 않았어요.** `data` 폴더 전체를 검색해 평문이 들어 있는 파일 0개 확인 |
| `secrets` 접근 권한 | 상속을 끊고 현재 사용자(`USER`) 전체 권한만 (`icacls`로 확인). 비밀번호 파일 · `logs` · `data`도 `USER`만, 소유자 `USER` |
| `initdb` 명령 | `initdb.exe -D C:\bakery-secure\pg\data -U postgres --pwfile=C:\bakery-secure\pg\secrets\pg-test-pw.txt -A scram-sha-256 -E UTF8 --locale=C` (경로가 `pg` 안, OneDrive 밖, 미존재임을 확인한 뒤 실행). 종료 코드 0, `Success.` |
| 클러스터 | 파일 969개 · 폴더 26개 · 39.2MB. 로케일 `C`, 시간대 `Asia/Seoul`, 기본 `max_connections=100`/`shared_buffers=128MB`(→ 아래에서 축소), 데이터 체크섬 꺼짐 |
| 로컬 인증 설정 | `pg_hba.conf`: initdb 기본(6줄: local/host 127.0.0.1/::1/replication)을 **`host all all 127.0.0.1/32 scram-sha-256` 한 줄**로 축소 (원본은 `pg_hba.conf.initdb-original`로 보관). `postgresql.conf` 끝에 `listen_addresses='127.0.0.1'`, `port=54329`, `max_connections=20`, `shared_buffers=32MB`, 접속 기록 켜기 추가 |
| 시스템 변경 | `before-server` ↔ `after-initdb` 스냅샷: 서비스 · 계정 · 그룹 · 방화벽 · 레지스트리 · PATH · 열린 포트 · 예약 작업 · 프로세스 · 폴더 **전부 차이 0.** 차이는 `C:\bakery-secure\pg` 아래의 새 파일뿐 (`data` 24줄, `logs` · `secrets` · `snapshots`). `C:\bakery-secure` 밖 차이 없음 |
| 서버 상태 | PostgreSQL 프로세스 0, 5432 · 54329 리스닝 없음, `postmaster.pid` 없음, 서비스 0 |
| 유지한 것 | 기존 zip(`pg17.zip`)과 압축 푼 `pgsql\` 폴더는 건드리지 않았어요 |

**참고:** `initdb`의 마지막 안내문이 `pg_ctl … start` 명령을 보여주지만 **실행하지 않았어요.** 관문 B(서버 시작 · 접속 확인 · 시험 DB 생성)는 별도 승인 대기예요.

## 2026-10-15 · 4단계(관문 B): 로컬 서버 시작 → 바인딩 · 외부 차단 검사 → 빈 시험 DB 생성 → 정상 종료 (가짜 데이터 없음)

**승인 범위:** 서버 시작, 리스닝 주소 · 외부 접속 차단 검사, 빈 `bakery_rehearsal` 생성, 정상 종료. 표 생성 · 가짜 데이터 · 백업 · 복구 시험은 하지 않았어요. 실행은 `try/finally`로 묶어서 어떤 경우에도 마지막에 `pg_ctl stop -m fast -w`가 실행되게 했어요. 비밀번호는 화면 · 로그 · Git에 남기지 않았어요.

| 항목 | 결과 |
|---|---|
| 사전 점검 8항목 | 해시 동일 · 관리자 세션 아님 · `PG*`/`DATABASE_URL`/`SUPABASE*` 환경변수 0 · 54329 비어 있음 · 프로세스 없음 · `postmaster.pid` 없음 · `pg_hba.conf` 한 줄 · `listen_addresses`/`port` 설정 — 모두 통과 |
| 시작 | 21:10:28, `pg_ctl start` 종료 코드 0, `postgres` 프로세스 6개. **Windows 서비스로 등록하지 않음** (사용자 세션의 일반 프로세스) |
| UAC · 방화벽 창 | 없음 (감지된 프로세스는 Windows 보안 상시 프로세스 `SecurityHealth*`뿐, 창 제목 없음) |
| 실제 리스닝 주소 | TCP **`127.0.0.1:54329` 한 개만** (pid 13352). 다른 주소 · 포트 리스닝 0, postgres 소유 UDP 소켓 0 |
| 외부 접속 차단 | `127.0.0.1:54329` 연결 성공 / `192.168.219.103:54329` **연결 실패** / `[::1]:54329` **연결 실패** |
| 로컬 접속 (psql, 대상 고정) | 사용자 `postgres`, 서버 주소 `127.0.0.1`, `listen_addresses=127.0.0.1`, `port=54329`, 버전 `17.11`, 암호 방식 `scram-sha-256`. 시작 직후 DB: `postgres`, `template0`, `template1` |
| 인증 요구 확인 | 일부러 틀린 비밀번호로 시도 → 종료 코드 2, `password authentication failed` (거부됨) |
| 빈 DB 생성 | `CREATE DATABASE bakery_rehearsal ENCODING 'UTF8' TEMPLATE template0 LOCALE 'C'` 성공 → 인코딩 UTF8 / collate C / ctype C, 사용자 객체(표 · 보기 · 시퀀스) **0개** |
| 종료 | 21:10:40, `pg_ctl stop -m fast -w` 종료 코드 0. `postgres` 프로세스 0, 54329 리스닝 없음, `postmaster.pid` 없음, PostgreSQL 서비스 0, `PGPASSWORD` 환경변수 제거 |
| 서버 로그 `pg.log` | 접속 허가 · 해제, 빠른 종료 요청 → 체크포인트 → `database system is shut down`. **비밀번호 평문이 들어 있는 파일 0개** (로그 · 스냅샷 · 설정 파일 검사) |
| 시스템 변경 (`before-start` ↔ `after-gateB`) | 서비스 · 계정 · 방화벽 · 레지스트리 · PATH · 열린 포트 · 예약 작업 · 프로세스 · 폴더 **차이 0.** `C:\bakery-secure\pg` 안의 새 파일 3줄(`data`, `logs`, `snapshots`)뿐이고 밖은 0 |
| 데이터 폴더 | 파일 1,272개 · 47MB (DB 생성과 서버 가동으로 늘어남) |

**참고:** 스크립트를 처음 작성했을 때 해시테이블 문법 오류가 있었지만, 실행 전 점검 단계(UTF-8로 읽어 문법 검사)에서 잡아 고쳤어요. 서버 관련 명령은 그 전에는 한 번도 실행되지 않았어요. 관문 C(가짜 데이터 복구 시험)는 계획 승인 전까지 하지 않아요 (`gate-c-plan.md`).
