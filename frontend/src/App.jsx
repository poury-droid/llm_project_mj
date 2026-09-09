import React from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationList from "./pages/ApplicationList.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";
import PdfAnalyze from "./pages/PdfAnalyze.jsx";
import StudyPlanPage from "./pages/StudyPlanPage.jsx";
import StudyPlanDetail from "./pages/StudyPlanDetail.jsx";
import StudyPlanWizard from "./pages/StudyPlanWizard.jsx";
import StudyPlannerHome from "./pages/StudyPlannerHome.jsx";
import CredentialsPage from "./pages/CredentialsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import "./styles/studyWizard.css";
import "./styles/profile.css";
import "./styles/studyItemRemove.css";

function App() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const isLoginPage = location.pathname === "/login" || location.pathname === "/auth/callback";

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<LoginPage />} />
      </Routes>
    );
  }

  if (loading) {
    return <div className="auth-loading">인증 상태를 확인하는 중입니다...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">NS</span>
          <div>
            <strong>NextStep</strong>
            <small>취업 전형 비서</small>
          </div>
        </div>
        <div className="sidebar-profile">
          <span className="profile-avatar">{(user.email || "U").slice(0, 1).toUpperCase()}</span>
          <div><small>로그인 계정</small><strong>{user.email}</strong></div>
        </div>
        <nav>
          <NavLink to="/">한눈에 보기</NavLink>
          <NavLink to="/applications">지원 공고</NavLink>
          <NavLink to="/applications/new">공고 등록</NavLink>
          <NavLink to="/analyze/pdf">자료 분석</NavLink>
          <NavLink to="/study-plans">공부 플래너</NavLink>
          <NavLink to="/credentials">내 자격</NavLink>
          <button className="sidebar-logout" onClick={signOut} type="button">로그아웃</button>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
          <Route path="/applications/:id/study-plan" element={<StudyPlanDetail />} />
          <Route path="/applications/:id/study-plan/new" element={<StudyPlanWizard applicationMode />} />
          <Route path="/study-plans" element={<StudyPlannerHome />} />
          <Route path="/study-plans/new" element={<StudyPlanWizard />} />
          <Route path="/study-plans/:id" element={<StudyPlanDetail />} />
          <Route path="/credentials" element={<CredentialsPage />} />
          <Route path="/analyze/pdf" element={<PdfAnalyze />} />
          <Route path="/analyze/interview" element={<Navigate to="/analyze/pdf" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
