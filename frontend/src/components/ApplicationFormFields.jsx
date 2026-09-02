import React from "react";

export const stages = ["관심공고", "지원준비", "서류전형", "필기전형", "면접전형", "최종결과"];

function ApplicationFormFields({ form, setForm }) {
  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateList(name, value) {
    const items = value.split(",").map((item) => item.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, [name]: items }));
  }

  return (
    <div className="form-grid">
      <label>회사명<input value={form.company || ""} onChange={(e) => update("company", e.target.value)} required /></label>
      <label>직무명<input value={form.position || ""} onChange={(e) => update("position", e.target.value)} required /></label>
      <label className="wide">채용공고 제목<input value={form.title || ""} onChange={(e) => update("title", e.target.value)} required /></label>
      <label>지원 마감일<input type="date" value={form.deadline || ""} onChange={(e) => update("deadline", e.target.value)} required /></label>
      <label>현재 전형 단계<select value={form.stage || stages[0]} onChange={(e) => update("stage", e.target.value)}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
      <label>PDF 파일명<input value={form.pdfFileName || ""} onChange={(e) => update("pdfFileName", e.target.value)} /></label>
      <label>필기시험일<input type="date" value={form.writtenTestDate?.slice(0, 10) || ""} onChange={(e) => update("writtenTestDate", e.target.value)} /></label>
      <label>면접일<input type="datetime-local" value={form.interviewDate ? form.interviewDate.slice(0, 16) : ""} onChange={(e) => update("interviewDate", e.target.value)} /></label>
      <label>회신 마감<input type="date" value={form.replyDeadline || ""} onChange={(e) => update("replyDeadline", e.target.value)} /></label>
      <label>장소<input value={form.location || ""} onChange={(e) => update("location", e.target.value)} /></label>
      <label className="wide">시험과목, 쉼표로 구분<input value={(form.subjects || []).join(", ")} onChange={(e) => updateList("subjects", e.target.value)} /></label>
      <label className="wide">제출서류, 쉼표로 구분<input value={(form.requiredDocuments || []).join(", ")} onChange={(e) => updateList("requiredDocuments", e.target.value)} /></label>
      <label className="wide">메모<textarea value={form.memo || ""} onChange={(e) => update("memo", e.target.value)} /></label>
    </div>
  );
}

export default ApplicationFormFields;
