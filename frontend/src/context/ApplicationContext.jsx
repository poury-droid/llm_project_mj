import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const ApplicationContext = createContext(null);

export function ApplicationProvider({ children }) {
  // Context API는 여러 페이지에서 지원 공고 목록을 공유하기 위해 사용합니다.
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect는 컴포넌트가 처음 렌더링된 뒤 API에서 데이터를 가져오는 흐름을 보여줍니다.
  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  const value = useMemo(
    () => ({ applications, loading, error, refreshApplications }),
    [applications, loading, error, refreshApplications]
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplicationContext() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error("useApplicationContext는 ApplicationProvider 안에서 사용해야 합니다.");
  return context;
}
