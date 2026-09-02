# NextStep - 취업 전형 비서

NextStep은 채용공고 PDF, 채용 화면 캡처, 전형 안내 이미지, 이메일/문자 안내 캡처를 업로드하면 일정, 제출서류, 회신 업무, 필기 과목, 공부계획을 정리해주는 취업 전형 관리 웹서비스입니다.

현재 OCR과 AI 분석은 실제로 동작하지 않고 mock 결과를 반환합니다. 대신 파일 업로드, 미리보기, 자료 유형 선택, 분석 결과 수정, 필요한 항목 선택, 저장까지의 서비스 흐름은 실제로 조작할 수 있게 구현했습니다.

## 해결하려는 문제

취업준비생은 여러 회사의 지원 마감, 서류 제출, 필기시험, 면접 안내, 참석 회신을 동시에 관리해야 합니다. NextStep은 자료를 업로드한 뒤 시스템이 먼저 정리안을 제안하고, 사용자가 직접 확인/수정/선택한 내용만 실제 데이터로 반영하는 구조입니다.

핵심 흐름:

```text
사용자 입력
→ 시스템 mock 분석
→ 사용자 확인 및 수정
→ 필요한 할 일 선택
→ 데이터 저장
→ Dashboard와 상세 화면 재계산
→ 다음 행동 확인
```

## 이 앱은 논리적으로 실행 가능한가?

네. 현재 버전은 실제 OCR/AI만 mock이고, 나머지 흐름은 실행 가능한 구조입니다.

사용자가 `자료 분석` 화면에서 파일을 선택하면 서버에 바로 저장하지 않습니다. 사용자가 `분석하기` 버튼을 눌렀을 때만 `POST /api/analyze/file`로 전송됩니다. 백엔드는 파일 형식과 자료 유형을 보고 mock 분석 결과와 제안 할 일을 반환합니다. 프론트엔드는 이 결과를 입력 폼으로 보여주고, 사용자가 수정하거나 제안 할 일을 선택할 수 있게 합니다. 사용자가 `이대로 등록`을 눌러야 `POST /api/applications`와 `POST /api/applications/:id/tasks`가 호출되어 실제 JSON 저장소에 반영됩니다.

지원 상세 화면에서는 전형 단계를 바꿀 수 있습니다. 단계가 바뀌면 `PUT /api/applications/:id`로 현재 단계가 저장되고, 이어서 `POST /api/applications/:id/stage-checklist`가 호출되어 해당 단계의 기본 체크리스트가 생성됩니다. 체크리스트 완료/수정/삭제는 각각 API를 호출하고, 화면은 다시 데이터를 불러와 진행률과 D-Day를 재계산합니다.

Dashboard는 별도 데이터를 손으로 들고 있지 않습니다. `GET /api/dashboard`가 지원 공고와 체크리스트를 다시 읽어 오늘 할 일, 3일 이내 할 일, 긴급 업무, 가까운 시험/면접을 계산합니다. 따라서 상세 화면에서 체크리스트나 전형 단계를 바꾸면 Dashboard 내용도 다음 조회 시 바뀝니다.

## 화면 구성

- `Dashboard`: 진행 중 지원 수, 오늘 할 일, 3일 이내 할 일, 긴급 항목, 가까운 시험/면접 표시
- `지원 공고`: 샘플 포함 지원 공고 목록
- `공고 등록`: 수동으로 지원 공고 생성
- `지원 상세`: 일정, 제출서류, 과목, 체크리스트, 진행률, 전형 단계 변경
- `자료 분석`: PDF와 이미지 공통 업로드/분석/수정/선택/저장 화면
- `공부계획`: 필기시험일, 공부 시간, 가능 요일, 제외 날짜, 과목 중요도 기반 계획 생성

`전형 안내 분석`은 `자료 분석`과 기능이 같아서 별도 메뉴에서 제거했습니다. 면접 안내, 이메일 캡처, 문자 안내도 `자료 분석` 화면에서 자료 종류를 `면접 안내` 또는 `이메일 또는 문자 안내`로 선택해서 처리합니다.

## 주요 기능 연결

### 1. 자료 분석에서 신규 공고 등록

```text
파일 선택 또는 드래그 앤 드롭
→ 자료 종류 선택
→ 분석하기
→ mock 분석 결과 표시
→ 기업명/날짜/과목/서류 수정
→ 제안 할 일 선택
→ 이대로 등록
→ 지원 공고와 선택한 체크리스트 저장
→ 상세 페이지 이동
```

관련 파일:

- `frontend/src/components/FileUpload.jsx`
- `frontend/src/components/AnalysisResultEditor.jsx`
- `frontend/src/pages/PdfAnalyze.jsx`
- `backend/routes/analysisRoutes.js`
- `backend/services/analysisService.js`

### 2. 전형 단계 변경

```text
지원 상세 페이지
→ 현재 전형 단계 선택 변경
→ 지원 공고 stage 저장
→ 단계별 기본 체크리스트 생성
→ 상세 화면 다시 조회
→ 진행률과 D-Day 재계산
```

관련 파일:

- `frontend/src/pages/ApplicationDetail.jsx`
- `backend/controllers/applicationController.js`
- `backend/services/checklistService.js`

### 3. 체크리스트 조작

```text
체크박스 완료/취소 또는 항목 수정/삭제
→ task API 호출
→ 상세 데이터 다시 조회
→ 준비 진행률 재계산
→ Dashboard 조회 시 오늘 할 일과 긴급 항목 재계산
```

관련 파일:

- `frontend/src/components/TaskList.jsx`
- `frontend/src/hooks/useTasks.js`
- `backend/controllers/taskController.js`
- `backend/repositories/taskRepository.js`

### 4. D-Day 계산

```text
지원 마감일/필기시험일/면접일/회신 마감일
→ 날짜 유틸 계산
→ D-3 이내 주의, D-1/오늘 긴급, 지난 날짜 마감초과 표시
```

관련 파일:

- `frontend/src/components/DdayBadge.jsx`
- `frontend/src/hooks/useDday.js`
- `frontend/src/utils/dateUtils.js`
- `backend/utils/dateUtils.js`

### 5. 공부계획 생성

```text
필기시험일 입력
→ 평일/주말 공부 시간 입력
→ 공부 가능한 요일 선택
→ 제외 날짜 선택
→ 과목별 중요도 입력
→ 공부계획 만들기
→ 일별 공부 블록 생성
→ 개별 공부 일정 완료 처리
```

관련 파일:

- `frontend/src/pages/StudyPlanPage.jsx`
- `backend/controllers/studyPlanController.js`
- `backend/services/studyPlanService.js`
- `backend/repositories/studyPlanRepository.js`

## 기술 스택

- Frontend: React, React Router, Context API, fetch, CSS
- Backend: Node.js, Express
- Database: JSON 파일 기반 저장소
- API: REST API
- File upload: multer
- AI/OCR: 현재 mock, 추후 실제 API 교체 가능

## 프로젝트 구조

```text
project-root/
  package.json
  README.md
  backend/
    app.js
    server.js
    data/db.json
    routes/
    controllers/
    services/
    repositories/
    middleware/
    utils/
  frontend/
    index.html
    package.json
    src/
      App.jsx
      main.jsx
      styles.css
      components/
      pages/
      context/
      hooks/
      services/
      utils/
```

## 실행 방법

루트에서 설치:

```bash
npm run install:all
```

루트에서 실행:

```bash
npm run dev
```

PowerShell 실행 정책 오류가 나면:

```bash
npm.cmd run dev
```

브라우저 주소:

```text
http://localhost:4000
```

백엔드가 `frontend/dist`를 같이 제공하므로 `4000` 하나만 열면 화면과 API가 함께 동작합니다. 프론트 preview 서버가 별도 포트로 뜰 수도 있지만, 일반 확인은 `http://localhost:4000`을 권장합니다.

## REST API 목록

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/applications`
- `GET /api/applications/:id`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/applications/:id/stage-checklist`
- `GET /api/applications/:id/tasks`
- `POST /api/applications/:id/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/analyze/file`
- `GET /api/applications/:id/study-plan`
- `POST /api/applications/:id/study-plan`
- `PATCH /api/applications/:id/study-plan`
- `DELETE /api/applications/:id/study-plan`

예전 호환용으로 `POST /api/analyze/job-posting`, `POST /api/analyze/interview-notice`도 남아 있지만, 화면에서는 통합 API인 `POST /api/analyze/file`만 사용합니다.

## 현재 mock인 기능

- PDF 텍스트 추출
- 이미지 OCR
- 이메일/문자 실제 분석
- LLM API 분석
- Gmail 연동
- Google Calendar 연동
- 이메일 자동 회신
- 실제 알림 발송

## 실제 OCR/AI를 붙일 위치

- 업로드 처리: `backend/middleware/upload.js`
- 통합 파일 분석: `backend/services/analysisService.js`의 `analyzeFileMock`
- PDF 분석 교체: `analyzeJobPostingMock`
- 이미지/면접 안내 분석 교체: `analyzeInterviewNoticeMock`
- 필기시험 안내 분석 교체: `analyzeWrittenTestMock`

실제 구현 시에는 다음 순서로 교체하면 됩니다.

```text
파일 업로드
→ PDF 텍스트 추출 또는 OCR
→ 추출 텍스트를 LLM에 전달
→ JSON 구조로 변환
→ 기존 AnalysisResultEditor에 표시
→ 사용자가 수정/확정
```

## React에서 배울 수 있는 개념

- `useState`: 파일 선택, 분석 결과, 폼 입력값, 체크리스트 수정 상태 관리
- `useEffect`: 화면 진입 시 API 데이터 조회
- Context API: 여러 화면에서 지원 공고 목록 공유
- custom hook: `useApplications`, `useTasks`, `useDday`
- `fetch`: REST API 호출
- React Router: Dashboard, 목록, 상세, 분석, 공부계획 화면 이동

## 초보자가 먼저 읽을 파일 순서

1. `README.md`
2. `backend/app.js`
3. `backend/routes/applicationRoutes.js`
4. `backend/controllers/applicationController.js`
5. `backend/repositories/jsonRepository.js`
6. `backend/services/analysisService.js`
7. `frontend/src/main.jsx`
8. `frontend/src/App.jsx`
9. `frontend/src/context/ApplicationContext.jsx`
10. `frontend/src/services/api.js`
11. `frontend/src/components/FileUpload.jsx`
12. `frontend/src/pages/PdfAnalyze.jsx`
13. `frontend/src/pages/ApplicationDetail.jsx`
14. `frontend/src/pages/StudyPlanPage.jsx`

## 향후 추가 기능

- 실제 PDF 텍스트 추출
- OCR
- LLM API 연결
- Gmail 연동
- Google Calendar 연동
- 이메일 자동 회신 초안 생성
- 브라우저 알림
- 실제 알림 발송
