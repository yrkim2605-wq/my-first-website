# 백업 워크플로 초안 변경 검토표 (3차 개정, 2026-10-15)

> **이 변경은 어디에도 켜지지 않았어요.** `backup-db.yml.draft` 는 이 공개 저장소의 *초안 파일*일 뿐이고, 비공개 백업 저장소도, 비밀값(`SUPABASE_DB_URL`, `AGE_PUBLIC_KEY_*`)도, GitHub Actions 실행도 **없어요**.
> 가짜 데이터 재시험으로 확인하기 전에는 적용하지 않고, 적용 전에 사용자 승인을 따로 받아요. `cleanup-backups.yml.draft` 는 바꾸지 않았어요.
> 변경 전후는 `git diff -- lecture1/my-bakery-review/docs/backup/backup-db.yml.draft` 로도 볼 수 있어요.

## 바뀐 곳 (3가지)

| # | 위치 | 이전 | 이후 | 이유 |
|---|---|---|---|---|
| 1 | `DB 내보내기` — public 덤프 | `--format=custom --no-owner --no-privileges --schema=public` | `--format=custom --no-owner --schema=public` | `--no-privileges` 때문에 GRANT 73줄이 복원본에서 사라졌어요(T07.grant). 권한 포함 덤프는 `admins` 표 1줄(저장 방식 차이, 실제 접근은 같음)을 빼고 모두 일치했어요(T08b) |
| 2 | `내보낸 파일이 정상인지 확인` | public 항목 수 > 20, 계정 덤프 TABLE DATA = 2 | 위에 더해 **권한(ACL) 항목 > 0**(없으면 실패) | `--no-privileges` 가 실수로 다시 들어가는 것을 막아요. 내용은 출력하지 않고 개수만 봐요 |
| 3 | 같은 단계 | — | **`SCHEMA public` 항목 수 확인(1개가 아니면 경고만, 백업은 막지 않음)** | 복구 때 이 항목만 빼고 복원하는 절차(`restore-procedure.md` 2장)가 전제하는 구조를 미리 알려요. 실제 Supabase에서도 1개인지는 첫 실행 때 확인해요 |

바뀌지 않은 것: 계정 덤프(`--no-owner --no-privileges --data-only`, 데이터만이라 권한 항목 없음), 키 2개 검증, 암호화, Artifact `retention-days: 25`, 일정(`0 18 * * *`), `permissions: contents: read`, 로그에 비밀값을 찍지 않는 방식.

## 새로 생기는 영향 (검토해야 할 점)

1. **파일 크기**: 권한 문장이 들어가 덤프가 커져요. 가짜 환경 기준 `public.dump` 60,001B → `public-with-privileges.dump` 75,027B(약 +25%). 실제 크기는 실제 데이터로만 알 수 있어요.
2. **복원 시 역할 필요**: 덤프의 `GRANT … TO anon/authenticated/service_role` 은 대상에 같은 역할이 없으면 오류예요. 호스팅 Supabase 새 프로젝트에는 있지만 로컬 시험 서버는 시험 SQL이 만들어요.
3. **소유자**: 여전히 `--no-owner` 라 소유자는 복원 계정이 돼요(`restore-procedure.md` 4장). 소유자가 다르면 "소유자만 접근" 같은 기본 권한의 소유자 이름도 달라져요.
4. **기본 권한(ALTER DEFAULT PRIVILEGES)**: 실제 Supabase `public` 에 있는 기본 권한이 덤프에 포함되는지, 복원 때 오류 없이 적용되는지는 가짜 환경에서 확인하지 못했어요 → Supabase 전용 확인 항목.
5. **민감도**: 권한 문장에는 역할 이름과 표 이름만 있고 비밀값은 없어요. 덤프 파일은 이전과 같이 암호화해서만 올려요.

## 적용 조건 (모두 충족되기 전에는 켜지 않아요)
- [ ] 가짜 데이터 재시험(별도 승인)에서 T05a0, T05a, T08a~T08f, T06b가 기대대로 나옴
- [ ] 실제 Supabase에서 확인할 항목(기본 권한, SCHEMA public 항목 수, 소유자)을 확인할 방법 합의
- [ ] 백업 보관처(비공개 GitHub 저장소) · 국외 이전 고지 확인 · 운영 키 생성 · 자동 백업 설정에 대한 **각각의 별도 승인** (모두 아직 없음)
