# Backend

NextStep의 REST API 서버입니다. Express가 요청을 받고, 서비스 로직을 거쳐 JSON 파일 저장소를 읽고 씁니다.

## 기술 스택

- Node.js
- Express 4
- Multer: 파일 업로드
- CORS
- JSON 파일 저장소

## 실행

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:4000`에서 실행됩니다.

운영 실행:

```bash
npm start
```

상태 확인:

```text
GET http://localhost:4000/api/health
```

## 처리 구조

```text
route
→ controller
→ service 또는 repository
→ backend/data/db.json
→ JSON response
```

```text
backend/
├─ app.js                    # Express 설정, 미들웨어, 라우트, 정적 파일
├─ server.js                 # 서버 시작
├─ data/db.json              # 데이터 저장 파일
├─ routes/                   # URL과 controller 연결
├─ controllers/              # 요청·응답과 상태 코드 처리
├─ services/                 # 분석·체크리스트·공부계획 생성
├─ repositories/             # JSON 조회·추가·수정·삭제
├─ middleware/               # 업로드·검증·오류 처리
└─ utils/                    # 날짜 계산
```

## API

### 기본

- `GET /api/health`
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

### 자료 분석

- `POST /api/analyze/file`

### 공부계획

- `GET /api/applications/:id/study-plan`
- `POST /api/applications/:id/study-plan`
- `PATCH /api/applications/:id/study-plan`
- `DELETE /api/applications/:id/study-plan`

## 주요 백엔드 역할

### Dashboard

`dashboardController.js`가 지원 공고, 할 일, 공부계획을 조회해 한눈에 보기용 데이터로 계산합니다.

- 진행 중 지원 수
- 이번 주 마감
- 오늘·3일 이내·긴급 할 일
- 가까운 전형 일정
- 전형 일정 달력 이벤트
- 공부계획 미완료 항목

### 지원 공고

`applicationController.js`가 공고의 등록·조회·수정·삭제를 처리합니다. 지원 공고를 삭제하면 연결된 체크리스트와 공부계획도 함께 제거합니다.

### 체크리스트

`checklistService.js`가 현재 전형 단계에 맞는 기본 체크리스트를 생성합니다. 완료 상태 변경은 task API를 통해 저장됩니다.

### 공부계획

`studyPlanService.js`가 필기시험일, 공부 가능 시간, 가능 요일, 제외 날짜, 과목 중요도를 기준으로 일별 공부 블록을 생성합니다.

## 데이터 저장

데이터베이스 서버 없이 `data/db.json`에 저장합니다.

```json
{
  "applications": [],
  "tasks": [],
  "studyPlans": []
}
```

각 체크리스트와 공부계획은 `applicationId`로 지원 공고와 연결됩니다.

## 자료 분석의 현재 상태

`services/analysisService.js`는 현재 mock 분석 결과를 반환합니다.

실제 기능으로 교체할 때 연결할 위치:

- `middleware/upload.js`: 파일 업로드
- `services/analysisService.js`: PDF 추출, OCR, LLM 호출
- `controllers/analysisController.js`: 분석 요청과 응답

프론트엔드 `AnalysisResultEditor`가 사용하는 응답 필드 구조를 유지하면 화면 변경을 최소화할 수 있습니다.

