# NextStep

취업 전형과 필기시험 준비를 관리하는 React + Express 웹 애플리케이션입니다.

## 빠른 실행

```bash
npm run install:all
npm run dev
```

PowerShell에서 실행 정책 오류가 발생하면 `npm.cmd`를 사용합니다.

```bash
npm.cmd run install:all
npm.cmd run dev
```

접속 주소: `http://localhost:4000`

## 문서

- [프론트엔드 README](frontend/README.md)
- [백엔드 README](backend/README.md)

## 전체 구성

```text
frontend/  React 화면, 라우팅, 상태 관리, API 호출
backend/   Express API, 비즈니스 로직, JSON 저장소
```

자료 분석의 OCR/AI 결과는 현재 mock 데이터입니다. 파일 업로드, 결과 수정, 공고 저장까지의 흐름은 동작합니다.
