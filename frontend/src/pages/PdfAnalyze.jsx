import React, { useEffect, useState } from "react";
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
  const [credentials, setCredentials] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCredentials().then(setCredentials).catch(() => setCredentials([]));
  }, []);

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
      const tasks = [...suggestedTasks];
      if (analysisResult.replyRequired && !tasks.some((task) => task.category === "회신" || task.title?.includes("회신"))) {
        tasks.unshift({
          title: "회신 필요 여부 확인 및 회신",
          category: "회신",
          dueDate: analysisResult.replyDeadline || analysisResult.deadline || "",
          priority: "high",
          defaultAction: "add"
        });
      }
      for (const task of tasks) {
        if (!task.title?.trim()) continue;
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
          <h1>OCR/AI 채용 자료 분석</h1>
          <p>채용공고 이미지나 PDF를 업로드하면 OCR로 글자를 추출하고, AI가 날짜·장소·시험과목을 분석합니다.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <FileUpload defaultDocumentType="job-posting" onAnalyze={analyze} />
      <AnalysisResultEditor
        result={analysisResult}
        setResult={setAnalysisResult}
        suggestedTasks={suggestedTasks}
        setSuggestedTasks={setSuggestedTasks}
        credentials={credentials}
        onReanalyze={() => analyze()}
        onSave={save}
        saveLabel="이대로 등록"
      />
    </section>
  );
}

export default PdfAnalyze;
