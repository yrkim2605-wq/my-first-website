# 복구 절차 (초안 · 2026-10-15) — 순서, public 스키마 충돌, 권한, 역할·소유권

> **상태: 초안이에요. 아직 검증 완료가 아니에요.** 1차 가짜 데이터 시험(통과 26 · 실패 12 · 관찰 4)과 그 원인 분석(`rehearsal/ANALYSIS-gateC.md`)을 바탕으로 정리했고,
> 이 문서의 절차는 **재시험(가짜 데이터, 별도 승인)으로 확인하기 전까지 검증된 절차로 취급하지 않아요.**
> 이 문서는 운영 DB를 건드리지 않아요. 운영 DB에는 `INSERT`만 하고 `--clean` · `DROP` · `TRUNCATE`는 쓰지 않는다는 `README.md` 9장 원칙이 그대로 적용돼요.
> 사진 파일 백업(미구현), 탈퇴 회원 신고 기록 설계 공백, 운영 DB 전체 손실 시 탈퇴 계정 재생성 위험은 **여전히 미해결**이에요(아래 7장).

## 1. 복구 순서 (새로 세우는 경우: 빈 DB에서 시작)

```
① 빈 DB(또는 새 프로젝트)       Supabase 기본 환경(auth · storage 스키마, anon/authenticated/service_role 역할)이 있어야 해요
② 계정 데이터 복원              auth-users.dump  →  pg_restore --no-owner --data-only
③ public 복원                   public.dump      →  pg_restore --no-owner -L <SCHEMA public 항목만 뺀 목록>   (2장)
④ auth · storage 객체 재적용    50-reapply-outside-public.sql (프로필 자동 생성 트리거) + 마이그레이션 0003 · 0008 · 0010 (photos 버킷 · 저장소 정책)
⑤ 확인                          행 수 · 체크섬 · 권한 · 역할별 읽기 결과 (재시험의 T05~T08 항목과 같은 기준)
```

**순서를 바꾸면 안 되는 이유 (1차 시험에서 확인한 사실)**
- 마이그레이션(트리거 포함)을 **먼저** 적용한 DB에 계정을 복원하면 프로필이 자동으로 6개 만들어지고(T09a), 그 뒤 public 데이터를 복원하면 `NOT_SIGNED_IN` 오류 9개가 나며 일지가 0개가 됐어요(T09b). → **트리거는 데이터를 넣은 뒤에(④) 만들어요.**
- public 덤프에는 `auth.users` 트리거, `storage.objects` 정책, `photos` 버킷이 없어요(T07.trigger · storage · bucket). 그래서 ④가 필요해요. 트리거 정의는 마이그레이션 0001과 같다는 것을 T08d로 확인했어요.
- 사진 파일(`storage.objects`)은 백업하지 않아요(T07.object). ④로 버킷과 정책은 생기지만 **파일은 비어 있어요** — 사진 경로가 있는 일지의 사진은 보이지 않아요(미해결).

## 2. public 스키마 충돌: `CREATE SCHEMA public` 항목만 제외하고 복원

1차 시험의 실패 원인(T05a · T08a · INFRA)이에요. `public.dump` 안의 `CREATE SCHEMA public;` 이 새 DB의 기본 `public` 과 부딪혀 `schema "public" already exists` 오류가 1개 나요(나머지는 정상 복원됨). 실제 Supabase 새 프로젝트에도 `public` 이 이미 있으므로 같은 일이 생겨요.

해결(시험 실행기 `gateC.ps1` 의 `Restore-PublicDump` 와 같은 방식):

```bash
pg_restore -l public.dump > public.list                         # 1) 목차 만들기
grep -cE '^[0-9]+; [0-9]+ [0-9]+ SCHEMA - public( |$)' public.list   # 2) 정확히 1이어야 해요. 아니면 여기서 멈춰요
grep -vE '^[0-9]+; [0-9]+ [0-9]+ SCHEMA - public( |$)' public.list > public.filtered.list
pg_restore --no-owner -L public.filtered.list -d <대상 DB> public.dump   # 3) 그 한 줄만 뺀 목록으로 복원
```

- `SCHEMA public` 줄만 뺍니다. 스키마의 **권한 항목(`ACL … SCHEMA public`)과 설명(`COMMENT … SCHEMA public`)은 그대로 복원**돼요.
- `--clean --if-exists` 는 쓰지 않아요. 기존 `public` 을 통째로 지워서 Supabase가 설정해 둔 기본값을 잃을 수 있고, 운영 DB에 `--clean` 을 쓰지 않는 원칙과도 어긋나요.
- 항목이 0개 또는 2개 이상이면 **복원하지 않고 멈추고 확인**해요(필터가 엉뚱한 항목을 지우지 않게).
- 위 `grep` 정규식은 1차 시험 덤프의 목차 형식(`번호; 번호 번호 SCHEMA - public 소유자`)을 기준으로 한 거예요. `pg_restore -l` 실제 출력으로 한 번 확인해야 해서 **재시험의 첫 확인 항목**이에요(T05a0).

## 3. 권한(GRANT) — 백업에 포함해요

1차 결과: `--no-privileges` 로 받은 덤프는 GRANT가 통째로 빠졌어요(T07.grant, 73줄 차이). 권한을 포함한 덤프(`public-with-privileges.dump`)를 복원하면 **표·열·함수 권한은 `admins` 표 1줄을 뺀 나머지가 모두 같았어요**(T08b). 그 1줄은 권한이 없는 것이 아니라 **저장 방식 차이**였어요:
- 마이그레이션 0009가 `revoke all on public.admins from anon, authenticated;` 를 실행해서 원본 표는 "소유자만 접근"이라는 값이 **명시적으로** 저장돼 있어요. 이건 PostgreSQL 기본값(권한 칸이 비어 있음 = 소유자만)과 의미가 같아서 pg_dump가 아무것도 내보내지 않고, 복원본은 비어 있어요. **실제 접근은 똑같아요.**
- 그래서 비교 방법을 바꿨어요(승인됨): 권한은 **유효 권한**(비어 있으면 PostgreSQL 기본 권한으로 풀어서)으로 비교하고, **실제 역할별 접근**(`has_*_privilege` 결과, 역할을 바꿔 직접 읽어 본 결과)도 비교해요. 저장 방식만 다른 항목은 참고 정보(T08b2)로 따로 보여줘요. **실질적인 접근 차이는 실패**로 판정해요.

워크플로 초안은 `--no-privileges` 를 뺐어요(`workflow-change-review.md`).

## 4. 역할 · 소유권 주의사항

- **필요한 역할**: 복원 대상에 `anon`, `authenticated`, `service_role` 이 있어야 해요. 덤프의 `GRANT … TO anon` 문장은 역할이 없으면 오류가 나요. 호스팅된 Supabase 새 프로젝트에는 이 역할이 기본으로 있어요. (로컬 시험에서는 `00-auth-stub.sql` 이 만들어요.)
- **소유자**: 덤프는 `--no-owner` 라서 모든 객체의 소유자는 **복원을 실행한 계정**이 돼요. 로컬 시험은 `postgres`, 원본도 `postgres` 소유라서 같았어요. 소유자가 다르면 "기본 권한(소유자만)"의 소유자 이름이 달라져서 유효 권한 비교가 **다르다고 나올 수 있어요** — 이건 의도된 민감도예요(소유자가 다른 것은 실제 차이). 다른 계정으로 복원한다면 그 점을 먼저 확인해요.
- **기본 권한(ALTER DEFAULT PRIVILEGES)**: 실제 Supabase의 `public` 에는 역할별 기본 권한이 설정돼 있을 수 있어요. pg_dump가 이를 포함하는지, 복원 때 그 문장이 오류 없이 적용되는지는 **로컬 시험(가짜 환경)에서는 확인하지 못했어요**(덤프에서 `ALTER DEFAULT PRIVILEGES` 0개). → Supabase 전용 확인 항목.
- **슈퍼유저 권한**: 호스팅된 Supabase의 `postgres` 계정은 슈퍼유저가 아니라서 `session_replication_role` 변경이나 사용자 트리거를 끄는 일이 로컬과 다르게 막힐 수 있어요(`README.md` 2장 ②). 상황 A 절차(트리거를 끄고 INSERT)는 로컬에서만 검증됐어요.
- **임시 키·복호화 파일**: 복호화한 덤프는 `C:\bakery-secure\pg` 같은 OneDrive 밖 폴더에서만 다루고, 당일 삭제해요(`README.md` 7장).

## 5. 상황 A(운영 DB가 살아 있음) — 변경 없음, 단 일부는 미확인
사용자 트리거만 끄고 → `INSERT … ON CONFLICT DO NOTHING` 만 → 다시 켜기(T10c~T10j로 검증, 1차 통과). 단 **T10k(탈퇴자 글에 달린 댓글·좋아요 미복구 확인)는 1차에서 실행 오류로 검증되지 않았어요.** 재시험의 T10k0·T10k로 확인해요.

## 6. 이 문서가 바꾸지 않는 것
- 방침·약관 문구: 백업은 계속 **예정형**("아직 운영하지 않아요")이에요. 운영 전에는 "매일 백업하고 있다" 같은 현재형을 쓰지 않아요.
- 운영 워크플로(`backup-db.yml.draft`, `cleanup-backups.yml.draft`): **켜지 않았고 실행하지 않았어요.** 비공개 백업 저장소도, 암호화 운영 키도, 자동 백업도 아직 없어요.
- main 병합 · push · 배포: 하지 않았어요.

## 7. 미해결 항목 (그대로 유지)
1. **사진 파일(Storage) 백업 미구현** — 복구 후 사진이 없는 일지가 생겨요(T07.object · T07.photo).
2. **탈퇴 회원에 대한 신고 기록 설계 공백** — 격리 방식에서 신고가 공개 쪽으로 자동 복원되지 않아요(Q15b). 설계 결정 필요.
3. **운영 DB 전체 손실 시 탈퇴 계정 재생성 위험** — 격리(quarantine) 방식은 설계만 있고 구현 보류. 상황 B(Q01~Q15, T11)는 아직 한 번도 실행되지 않았어요.
4. 호스팅 Supabase에서의 실제 로그인·권한·기본 권한 동작(로컬 시험으로는 확인 불가).
