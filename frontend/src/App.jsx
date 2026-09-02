import React from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationList from "./pages/ApplicationList.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";
import PdfAnalyze from "./pages/PdfAnalyze.jsx";
import StudyPlanPage from "./pages/StudyPlanPage.jsx";

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✓</span>
          <div>
            <strong>NextStep</strong>
            <small>취업 전형 비서</small>
          </div>
        </div>
        <nav>
          <NavLink to="/">대시보드</NavLink>
          <NavLink to="/applications">지원 공고</NavLink>
          <NavLink to="/applications/new">공고 등록</NavLink>
          <NavLink to="/analyze/pdf">자료 분석</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
          <Route path="/applications/:id/study-plan" element={<StudyPlanPage />} />
          <Route path="/analyze/pdf" element={<PdfAnalyze />} />
          <Route path="/analyze/interview" element={<Navigate to="/analyze/pdf" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
