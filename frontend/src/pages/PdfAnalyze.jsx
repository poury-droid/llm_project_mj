import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalysisResultEditor from "../components/AnalysisResultEditor.jsx";
import FileUpload from "../components/FileUpload.jsx";
import { useApplications } from "../hooks/useApplications.js";
import { api } from "../services/api.js";

function PdfAnalyze() {
  const navigate = useNavigate();
  const { refreshApplications } = useApplications();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [lastFormData, setLastFormData] = useState(null);
  const [error, setError] = useState("");

  async function analyze(formData = lastFormData) {
    if (!formData) return;
    setLastFormData(formData);
    setError("");
    const data = await api.analyzeFile(formData);
    setAnalysisResult(data.analysis);
    setSuggestedTasks(data.suggestedTasks);
  }

  async function save() {
    try {
      const saved = await api.createApplication(analysisResult);
      for (const task of suggestedTasks) {
        const action = task.action || task.defaultAction;
        if (action === "add" || action === "done") {
          await api.createTask(saved.id, { ...task, completed: action === "done" });
        }
      }
      await refreshApplications();
      navigate(`/applications/${saved.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>채용 관련 자료 분석</h1>
          <p>PDF와 이미지를 업로드하고, 분석 결과를 직접 수정한 뒤 저장합니다.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <FileUpload defaultDocumentType="job-posting" onAnalyze={analyze} />
      <AnalysisResultEditor
        result={analysisResult}
        setResult={setAnalysisResult}
        suggestedTasks={suggestedTasks}
        setSuggestedTasks={setSuggestedTasks}
        onReanalyze={() => analyze()}
        onSave={save}
        saveLabel="이대로 등록"
      />
    </section>
  );
}

export default PdfAnalyze;
