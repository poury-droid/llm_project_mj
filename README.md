# NextStep - 취업 전형 관리 비서

NextStep은 취업 준비 과정에서 여러 회사의 지원 공고, 지원 마감일, 필기시험일, 면접일, 제출 서류, 체크리스트, 공부 계획을 한 곳에서 관리하는 웹 애플리케이션입니다.

채용 공고 PDF나 이미지 자료를 업로드해 분석 결과를 확인하고, 필요한 항목만 선택해 지원 공고와 체크리스트로 저장할 수 있습니다. 현재 OCR/AI 분석은 mock 결과를 반환하지만, 업로드부터 결과 수정, 저장까지의 화면 흐름은 실제로 동작합니다.

## 최근 추가 및 수정 기능

### 인증

- 이메일/비밀번호 기반 회원가입 및 로그인
- Google OAuth 로그인
- Google 로그인 시 계정 선택 화면이 뜨도록 `prompt=select_account` 적용
- 로그아웃 기능
- 비밀번호 재설정 기능
  - 로그인 화면에서 `비밀번호를 잊으셨나요?` 클릭
  - 이메일, 새 비밀번호, 비밀번호 확인 입력 후 변경
  - 현재는 개발용 방식이며 이메일 인증 링크 방식은 아직 미구현

### 계정별 데이터 분리

- 로그인한 사용자별로 데이터가 분리되도록 수정
- 다음 데이터에 `user_id`를 추가하고 조회/생성/수정/삭제를 사용자 기준으로 제한
  - 지원 공고
  - 체크리스트
  - 공부 계획
  - 자격증/시험 정보
- 대시보드도 로그인한 사용자의 데이터만 집계
- 기존에 이미 저장되어 있던 데이터는 소유자를 구분할 수 없어 첫 번째 기존 사용자에게 귀속

### 대시보드 개선

- `한눈에 보기` 화면 문구 정리
- 지원 마감일만 보이던 문제 수정
- 입력된 모든 주요 일정 표시
  - 지원 마감
  - 필기시험
  - 면접
  - 회신 마감
- 캘린더에 전체 전형 일정 표시
- 가장 가까운 D-Day를 전체 일정 기준으로 계산
- 공고 카드에서 입력된 일정들을 함께 표시
- 로그인 화면은 이미지 기반의 감성적인 첫 화면으로 개선
- 로그인 후 대시보드는 업무 도구처럼 정보 밀도를 유지하도록 정리

### 실행 및 환경 설정

- Supabase DB 연결을 위한 `DATABASE_URL` 사용
- Supabase Auth 연동을 위한 환경변수 사용
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- 로컬 개발 Redirect URL 예시

```text
http://localhost:4173/auth/callback
http://127.0.0.1:4173/auth/callback
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
http://localhost:4000/auth/callback
```

## 주요 화면

- `Dashboard`: 한눈에 보기, 전형 일정 캘린더, 오늘 할 일, 긴급 체크리스트, 오늘의 공부 계획
- `지원 공고`: 등록된 지원 공고 목록
- `공고 등록`: 지원 회사, 직무, 마감일, 필기시험일, 면접일, 회신 마감 등 직접 입력
- `지원 상세`: 공고 상세 정보, 전형 단계, 체크리스트, 공부 계획 확인
- `자료 분석`: PDF/이미지 자료 업로드, mock 분석 결과 확인 및 저장
- `공부 계획`: 필기시험일, 공부 가능 시간, 과목 중요도 기반 공부 일정 생성
- `자격증`: 자격증이나 시험 정보를 별도로 관리
- `로그인`: 이메일 로그인, Google 로그인, 회원가입, 비밀번호 재설정

## 주요 기능 흐름

### 1. 자료 분석에서 공고 등록

```text
파일 선택 또는 드래그 앤 드롭
-> 자료 종류 선택
-> 분석하기
-> mock 분석 결과 표시
-> 회사명/일정/과목/서류 수정
-> 필요한 항목 선택
-> 그대로 등록
-> 지원 공고와 체크리스트 저장
```

관련 파일:

- `frontend/src/pages/PdfAnalyze.jsx`
- `frontend/src/components/FileUpload.jsx`
- `frontend/src/components/AnalysisResultEditor.jsx`
- `backend/routes/analysisRoutes.js`
- `backend/services/analysisService.js`

### 2. 지원 공고와 전형 일정 관리

```text
공고 등록
-> 지원 마감일, 필기시험일, 면접일 입력
-> 한눈에 보기 캘린더에 일정 표시
-> 가장 가까운 일정 D-Day 계산
-> 상세 화면에서 전형 단계와 체크리스트 관리
```

관련 파일:

- `frontend/src/pages/ApplicationForm.jsx`
- `frontend/src/pages/ApplicationDetail.jsx`
- `frontend/src/components/ApplicationDdayList.jsx`
- `backend/controllers/applicationController.js`
- `backend/repositories/applicationRepository.js`

### 3. 체크리스트 관리

```text
전형 단계 변경
-> 단계별 기본 체크리스트 생성
-> 항목 완료/수정/삭제
-> 대시보드 오늘 할 일과 긴급 항목에 반영
```

관련 파일:

- `frontend/src/components/TaskList.jsx`
- `frontend/src/hooks/useTasks.js`
- `backend/controllers/taskController.js`
- `backend/repositories/taskRepository.js`
- `backend/services/checklistService.js`

### 4. 공부 계획 생성

```text
필기시험일 선택
-> 평일/주말 공부 시간 입력
-> 공부 가능한 요일 선택
-> 제외 날짜 선택
-> 과목별 중요도 입력
-> 공부 계획 생성
-> 오늘의 공부 계획에 반영
```

관련 파일:

- `frontend/src/pages/StudyPlanWizard.jsx`
- `frontend/src/pages/StudyPlanDetail.jsx`
- `backend/controllers/studyPlanController.js`
- `backend/services/studyPlanService.js`
- `backend/repositories/studyPlanRepository.js`

## 기술 스택

- Frontend: React 18, React Router 6, Vite, Context API, CSS
- Backend: Node.js, Express
- Database: Supabase PostgreSQL
- Auth: 자체 이메일 로그인, Supabase Google OAuth
- File upload: multer
- AI/OCR: 현재 mock, 추후 실제 API 연동 가능

## 프로젝트 구조

```text
project-root/
  package.json
  README.md
  backend/
    app.js
    server.js
    config/
    controllers/
    db/
    middleware/
    repositories/
    routes/
    services/
    utils/
  frontend/
    index.html
    package.json
    src/
      App.jsx
      main.jsx
      styles.css
      components/
      context/
      hooks/
      pages/
      services/
      utils/
```

## 실행 방법

처음 설치:

```bash
npm run install:all
```

전체 실행:

```bash
npm start
```

PowerShell에서 `npm.ps1` 실행 정책 오류가 나면:

```bash
npm.cmd start
```

프론트엔드 개발 서버:

```bash
cd frontend
npm.cmd run dev:hot
```

프론트엔드 빌드:

```bash
cd frontend
npm.cmd run build
```

기본 접속 주소:

```text
http://localhost:4173
```

백엔드 API:

```text
http://localhost:4000/api
```

상태 확인:

```text
GET http://localhost:4000/api/health
```

## REST API 목록

### 인증

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### 대시보드

- `GET /api/dashboard`

### 지원 공고

- `GET /api/applications`
- `GET /api/applications/:id`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/applications/:id/stage-checklist`

### 체크리스트

- `GET /api/applications/:id/tasks`
- `POST /api/applications/:id/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/study-tasks/:id`
- `DELETE /api/study-tasks/:id`

### 자료 분석

- `POST /api/analyze/file`

### 공부 계획

- `GET /api/study-plans`
- `POST /api/study-plans/personal`
- `GET /api/study-plans/:id`
- `PATCH /api/study-plans/:id`
- `POST /api/study-plans/:id/rebalance`
- `DELETE /api/study-plans/:id`
- `GET /api/applications/:id/study-plan`
- `POST /api/applications/:id/study-plan`
- `PATCH /api/applications/:id/study-plan`
- `DELETE /api/applications/:id/study-plan`

### 자격증

- `GET /api/credentials`
- `POST /api/credentials`
- `PATCH /api/credentials/:id`
- `DELETE /api/credentials/:id`

## 현재 mock 또는 미구현 기능

- 실제 PDF 텍스트 추출
- 이미지 OCR
- LLM API 분석
- Gmail 연동
- Google Calendar 연동
- 이메일 자동 회신 초안 생성
- 이메일 기반 비밀번호 재설정 링크 발송
- 브라우저/모바일 푸시 알림

## 추후 개선 후보

- 실제 OCR/LLM 분석 연결
- Supabase 이메일 인증과 비밀번호 재설정 메일 연동
- Google Calendar 일정 내보내기
- 지원 일정 알림
- 사용자별 데이터 백업/내보내기
- 배포 도메인 기준 OAuth Redirect URL 정리
