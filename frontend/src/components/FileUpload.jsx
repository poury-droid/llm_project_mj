import React, { useEffect, useMemo, useState } from "react";

const documentTypes = [
  { value: "job-posting", label: "채용공고" },
  { value: "document-screening", label: "서류전형 안내" },
  { value: "written-test", label: "필기시험 안내" },
  { value: "interview", label: "면접 안내" },
  { value: "message", label: "이메일 또는 문자 안내" },
  { value: "other", label: "기타" }
];

function FileUpload({ defaultDocumentType = "job-posting", onAnalyze }) {
  // 파일 선택부터 분석 결과까지의 상호작용 상태를 한 컴포넌트에서 학습할 수 있게 모았습니다.
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState(defaultDocumentType);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!analyzing) return undefined;
    setElapsedSeconds(0);
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      type: file.type || "알 수 없음",
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      isImage: file.type.startsWith("image/")
    };
  }, [file]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(nextFile) {
    setError("");
    if (!nextFile) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(nextFile.type)) {
      setError("PDF, JPG, JPEG, PNG, WEBP 파일만 선택할 수 있습니다.");
      return;
    }
    setFile(nextFile);
  }

  async function analyze() {
    if (!file) {
      setError("분석할 파일을 먼저 선택하세요.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    setAnalyzing(true);
    setError("");
    let timeout;
    try {
      await Promise.race([
        onAnalyze(formData),
        new Promise((_, reject) => {
          timeout = window.setTimeout(() => reject(new Error("10초 안에 분석 결과를 받지 못했습니다. 이미지 용량을 줄이거나 다시 시도해 주세요.")), 12000);
        })
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      window.clearTimeout(timeout);
      setAnalyzing(false);
    }
  }

  return (
    <div className="panel upload-panel">
      <label>
        자료 종류
        <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
          {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input id="file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => selectFile(event.target.files[0])} />
        <label htmlFor="file-upload" className="file-picker">파일 선택 또는 드래그 앤 드롭</label>
        <p>PDF, JPG, JPEG, PNG, WEBP 지원</p>
      </div>

      {fileInfo && (
        <div className="file-preview">
          <div>
            <strong>{fileInfo.name}</strong>
            <p>파일 형식: {fileInfo.type}</p>
            <p>파일 크기: {fileInfo.size}</p>
          </div>
          {previewUrl && <img src={previewUrl} alt="업로드 이미지 미리보기" />}
          <div className="actions">
            <label className="button secondary" htmlFor="file-upload">파일 변경</label>
            <button className="button secondary" type="button" onClick={() => setFile(null)}>삭제</button>
            <button className="button" type="button" onClick={analyze} disabled={analyzing}>{analyzing ? "OCR/AI 분석 중" : "OCR/AI 분석 시작"}</button>
          </div>
        </div>
      )}

      {analyzing && <p className="muted" role="status">Gemini가 이미지의 글자와 면접일시·장소를 분석 중입니다. {elapsedSeconds}초</p>}

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default FileUpload;
