# Frontend

NextStep의 사용자 화면입니다. React와 React Router로 페이지를 구성하고, `fetch`로 백엔드 REST API를 호출합니다.

## 기술 스택

- React 18
- React Router 6
- Context API
- Vite
- CSS

## 실행

```bash
npm install
npm run dev:hot
```

기본 주소는 `http://localhost:5173`입니다.

PowerShell에서 `npm.ps1` 오류가 발생하면 다음 명령을 사용합니다.

```bash
npm.cmd run dev:hot
```

운영용 빌드:

```bash
npm run build
```

빌드 결과는 `frontend/dist`에 생성됩니다. 백엔드가 이 폴더를 정적 파일로 제공할 수 있습니다.

## 화면 경로

| 경로 | 화면 |
| --- | --- |
| `/` | 한눈에 보기, 전형 일정 달력, 공부 체크리스트 |
| `/applications` | 지원 공고 목록 |
| `/applications/new` | 지원 공고 등록 |
| `/applications/:id` | 지원 상세와 전형 체크리스트 |
| `/applications/:id/edit` | 지원 공고 수정 |
| `/applications/:id/study-plan` | 필기시험 공부계획 생성·관리 |
| `/analyze/pdf` | PDF/이미지 자료 분석 |

## 폴더 구조

```text
src/
├─ App.jsx                    # 공통 레이아웃과 라우팅
├─ main.jsx                   # React 진입점
├─ styles.css                 # 전체 스타일
├─ pages/                     # 화면 단위 컴포넌트
│  ├─ Dashboard.jsx           # 한눈에 보기
│  ├─ ApplicationList.jsx
│  ├─ ApplicationForm.jsx
│  ├─ ApplicationDetail.jsx
│  ├─ StudyPlanPage.jsx
│  └─ PdfAnalyze.jsx
├─ components/                # 재사용 UI
├─ context/                   # 지원 공고 전역 상태
├─ hooks/                     # API·체크리스트·D-Day 로직
├─ services/api.js            # REST API 호출 모음
└─ utils/dateUtils.js         # 날짜 표시와 D-Day 계산
```

## 상태 관리

- `ApplicationContext`: 지원 공고 목록과 로딩·오류 상태를 공유합니다.
- `useApplications`: Context 사용을 화면 코드에서 숨깁니다.
- `useTasks`: 체크리스트 추가·수정·삭제 API를 재사용합니다.
- `useDday`: 날짜를 `D-n`, `오늘`, `D+n` 형식으로 변환합니다.

## API 연결

`src/services/api.js`에서 모든 요청을 관리합니다.

기본 API 주소는 현재 브라우저 호스트의 4000번 포트입니다.

```text
http://localhost:4000/api
```

한눈에 보기 화면은 `GET /api/dashboard`를 호출해 다음 데이터를 받습니다.

- 오늘·긴급 할 일
- 가까운 전형 일정
- 달력용 지원 마감·필기시험·면접·최종 발표
- 필기시험 공부 체크리스트

자료 분석 화면은 분석 결과를 바로 저장하지 않습니다. 사용자가 결과를 수정하고 확정할 때 공고와 선택한 체크리스트를 저장합니다.

