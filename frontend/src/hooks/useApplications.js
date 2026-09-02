import { useApplicationContext } from "../context/ApplicationContext.jsx";

// custom hook은 Context 사용법을 숨겨서 페이지 코드가 더 읽기 쉬워지게 합니다.
export function useApplications() {
  return useApplicationContext();
}
