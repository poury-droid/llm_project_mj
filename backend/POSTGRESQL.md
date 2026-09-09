# PostgreSQL 백엔드 구조와 실행 방법

이 백엔드는 Express가 HTTP 요청을 받고, Repository가 `pg` 패키지를 통해
PostgreSQL에 SQL을 실행하는 구조입니다. Docker 없이 로컬 PostgreSQL을 사용할 수 있습니다.

## 폴더 구조

```text
backend/
  server.js                 서버 시작, DB 테이블 확인 후 포트 오픈
  app.js                    Express 설정, 미들웨어, 라우트 연결
  routes/                   URL과 컨트롤러 함수 연결
  controllers/              요청 검증 후 업무 흐름 실행, 응답 반환
  repositories/             PostgreSQL 조회/추가/수정/삭제
  db/
    pool.js                 PostgreSQL 연결 풀과 트랜잭션
    schema.js               applications/tasks/study_plans 테이블 생성
    create-database.js      PostgreSQL 데이터베이스 생성
    migrate-json-to-postgres.js  db.json 데이터를 PostgreSQL로 이전
  middleware/               공통 검증, 파일 업로드, 에러 처리
  services/                 체크리스트/학습 계획/분석 같은 업무 로직
  data/db.json              이전 데이터 원본 및 마이그레이션 입력 파일
```

## 요청 처리 흐름

```text
프론트엔드
  -> app.js의 /api 라우트
  -> 라우트가 컨트롤러 호출
  -> 컨트롤러가 저장소 호출
  -> 저장소가 db/pool.js의 query() 호출
  -> PostgreSQL
  -> 데이터 행 변환 후 JSON 응답
```

`schema.js`는 서버 시작 때 `CREATE TABLE IF NOT EXISTS`를 실행합니다.
따라서 테이블이 이미 있으면 유지하고, 처음 실행할 때만 생성합니다.

주요 테이블은 `applications`(지원 공고), `tasks`(공고별 할 일),
`study_plans`(공고별 학습 계획)입니다. 배열/객체 데이터는 PostgreSQL의 `jsonb`,
공고와 할 일/학습 계획의 연결은 외래키로 저장합니다.

## 1. PostgreSQL 설치

Windows에 PostgreSQL을 설치한 뒤 PostgreSQL 서비스가 실행 중인지 확인합니다.
설치할 때 `postgres` 사용자의 비밀번호를 `postgres`로 설정하지 않았다면
아래 실행 시 실제 비밀번호를 사용해야 합니다.

PowerShell에서 설치 및 서비스 상태를 확인하는 명령어입니다.

```powershell
Get-Service postgresql*
Get-Command psql
```

## 2. 데이터베이스 연결 설정

기본 로컬 연결 정보는 다음과 같습니다.

```text
postgres://postgres:postgres@localhost:5432/job_process_assistant
```

로컬 비밀번호나 데이터베이스 설정이 다르면 `DATABASE_URL`을 지정합니다.

```powershell
$env:DATABASE_URL = "postgres://postgres:YOUR_PASSWORD@localhost:5432/job_process_assistant"
```

또는 PostgreSQL 환경변수를 각각 지정할 수 있습니다.

```powershell
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "job_process_assistant"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "YOUR_PASSWORD"
```

## 3. 데이터베이스 생성 및 JSON 데이터 가져오기

프로젝트 루트에서 다음 명령어를 실행합니다.

```powershell
npm.cmd run db:init --prefix backend
```

데이터베이스가 없으면 `job_process_assistant` 데이터베이스를 생성하고,
테이블을 만든 뒤 `backend/data/db.json`의 기존 데이터를 PostgreSQL로 옮깁니다.

각 단계를 따로 실행할 수도 있습니다.

```powershell
npm.cmd run db:create --prefix backend
npm.cmd run db:migrate --prefix backend
```

마이그레이션은 여러 번 실행해도 안전합니다. 이미 같은 ID 또는 공고 ID가
있으면 기존 데이터를 새 데이터로 갱신합니다.

## 4. 백엔드 실행

백엔드가 시작될 때 테이블도 자동으로 확인 및 생성됩니다.

```powershell
npm.cmd run dev --prefix backend
```
