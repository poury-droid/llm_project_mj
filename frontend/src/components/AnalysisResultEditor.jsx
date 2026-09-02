import React from "react";
import ApplicationFormFields from "./ApplicationFormFields.jsx";

function AnalysisResultEditor({ result, setResult, suggestedTasks, setSuggestedTasks, onReanalyze, onSave, saveLabel = "이대로 등록" }) {
  function updateTask(index, updates) {
    setSuggestedTasks((prev) => prev.map((task, taskIndex) => taskIndex === index ? { ...task, ...updates } : task));
  }

  function addListItem(name) {
    const value = window.prompt(`${name === "subjects" ? "시험과목" : "제출서류"} 이름을 입력하세요.`);
    if (!value) return;
    setResult((prev) => ({ ...prev, [name]: [...(prev[name] || []), value] }));
  }

  function removeListItem(name, item) {
    setResult((prev) => ({ ...prev, [name]: (prev[name] || []).filter((value) => value !== item) }));
  }

  if (!result) return null;

  return (
    <form className="panel" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <div className="section-header">
        <div>
          <h2>분석 결과 확인 및 수정</h2>
          <p className="muted">AI mock 결과는 바로 저장하지 않고, 사용자가 수정하고 선택한 뒤 확정합니다.</p>
        </div>
        <button className="button secondary" type="button" onClick={onReanalyze}>다시 분석</button>
      </div>

      <ApplicationFormFields form={result} setForm={setResult} />

      <EditableChips title="시험과목" name="subjects" items={result.subjects || []} onAdd={addListItem} onRemove={removeListItem} />
      <EditableChips title="제출서류" name="requiredDocuments" items={result.requiredDocuments || []} onAdd={addListItem} onRemove={removeListItem} />

      <label className="check-label">
        <input type="checkbox" checked={Boolean(result.replyRequired)} onChange={(event) => setResult((prev) => ({ ...prev, replyRequired: event.target.checked }))} />
        회신 필요
      </label>

      <h3>분석 결과에서 제안된 할 일</h3>
      <div className="suggestion-list">
        {suggestedTasks.map((task, index) => (
          <div className="suggestion-row" key={`${task.title}-${index}`}>
            <div>
              <strong>{task.title}</strong>
              <p>{task.dueDate || "마감일 없음"} · {task.priority}</p>
            </div>
            <select value={task.action || task.defaultAction || "add"} onChange={(event) => updateTask(index, { action: event.target.value })}>
              <option value="add">할 일에 추가</option>
              <option value="done">이미 준비함</option>
              <option value="skip">필요 없음</option>
            </select>
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="button" type="submit">{saveLabel}</button>
      </div>
    </form>
  );
}

function EditableChips({ title, name, items, onAdd, onRemove }) {
  return (
    <div className="editable-chips">
      <div className="section-header compact">
        <h3>{title}</h3>
        <button className="button secondary" type="button" onClick={() => onAdd(name)}>추가</button>
      </div>
      <div className="tags">
        {items.map((item) => (
          <span key={item}>{item}<button type="button" onClick={() => onRemove(name, item)} title="삭제">×</button></span>
        ))}
      </div>
    </div>
  );
}

export default AnalysisResultEditor;
