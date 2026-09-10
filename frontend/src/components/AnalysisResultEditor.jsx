import React, { useMemo } from "react";
import ApplicationFormFields from "./ApplicationFormFields.jsx";

function AnalysisResultEditor({
  result,
  setResult,
  suggestedTasks,
  setSuggestedTasks,
  credentials = [],
  onReanalyze,
  onSave,
  saveLabel = "이대로 등록"
}) {
  const fit = useMemo(() => analyzeFit(result, credentials), [result, credentials]);

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

  function selectRole(position) {
    const roleData = result.roleRequirements?.[position] || {};
    setResult((prev) => ({
      ...prev,
      position,
      selectedRole: position,
      selectedRoleRequirements: roleData
    }));
  }

  if (!result) return null;

  return (
    <form className="panel" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <div className="section-header">
        <div>
          <h2>분석 결과 확인 및 수정</h2>
          <p className="muted">AI가 직무를 확정하지 않습니다. 지원 직무를 선택한 뒤 해당 기준으로 저장합니다.</p>
        </div>
        <button className="button secondary" type="button" onClick={onReanalyze}>다시 분석</button>
      </div>

      {result.roleOptions?.length > 0 && (
        <div className="panel soft-panel">
          <h3>지원 직무를 선택하세요</h3>
          <div className="weekday-selector">
            {result.roleOptions.map((role) => (
              <label className="check-label" key={role}>
                <input type="radio" checked={(result.position || result.selectedRole) === role} onChange={() => selectRole(role)} />
                {role}
              </label>
            ))}
          </div>
        </div>
      )}

      <ApplicationFormFields form={result} setForm={setResult} />

      <OcrResult result={result} />

      <QualificationFit fit={fit} />

      <EditableChips title="시험과목" name="subjects" items={result.subjects || []} onAdd={addListItem} onRemove={removeListItem} />
      <EditableChips title="제출서류" name="requiredDocuments" items={result.requiredDocuments || []} onAdd={addListItem} onRemove={removeListItem} />

      <label className="check-label">
        <input type="checkbox" checked={Boolean(result.replyRequired)} onChange={(event) => setResult((prev) => ({ ...prev, replyRequired: event.target.checked }))} />
        회신 필요
      </label>

      <h3>분석 결과에서 제안한 할 일</h3>
      <div className="suggestion-list">
        {suggestedTasks.map((task, index) => (
          <div className="suggestion-row" key={`${task.title}-${index}`}>
            <div>
              <input value={task.title || ""} onChange={(event) => updateTask(index, { title: event.target.value })} aria-label="할 일 제목" />
              <div className="suggestion-meta"><input type="date" value={task.dueDate || ""} onChange={(event) => updateTask(index, { dueDate: event.target.value })} aria-label="마감일" /><select value={task.priority || "normal"} onChange={(event) => updateTask(index, { priority: event.target.value })} aria-label="우선순위"><option value="urgent">긴급</option><option value="high">높음</option><option value="normal">보통</option><option value="low">낮음</option></select></div>
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

function OcrResult({ result }) {
  if (!result?.ocrStatus) return null;
  const hasText = Boolean(result.ocrText);

  return (
    <div className="ocr-panel">
      <div className="section-header compact">
        <h3>OCR 인식 결과</h3>
        <strong>{getOcrStatusLabel(result.ocrStatus, result.ocrConfidence, result.ocrEngine)}</strong>
      </div>
      {result.ocrMessage && <p className="muted">{result.ocrMessage}</p>}
      {result.analysisEngine && <p className="muted">분석 엔진: {result.analysisEngine}{result.analysisMessage ? ` · ${result.analysisMessage}` : ""}</p>}
      {hasText ? (
        <details>
          <summary>인식된 원문 보기</summary>
          <pre>{result.ocrText}</pre>
        </details>
      ) : (
        <p className="muted">인식된 텍스트가 없습니다.</p>
      )}
    </div>
  );
}

function getOcrStatusLabel(status, confidence, engine) {
  const engineLabel = engine ? `${engine} · ` : "";
  if (status === "success") return `${engineLabel}성공 ${confidence || 0}%`;
  if (status === "empty") return `${engineLabel}텍스트 없음`;
  if (status === "failed") return `${engineLabel}실패`;
  return `${engineLabel}건너뜀`;
}

function QualificationFit({ fit }) {
  return (
    <div className="fit-panel">
      <div className="section-header compact">
        <h3>지원 적합성 분석</h3>
        <strong>예상 가점: {fit.explicitBonusPoints > 0 ? `${fit.explicitBonusPoints}점` : "명시 점수 없음"}</strong>
      </div>
      <p className="muted">가점 수치는 공고에 명확한 점수가 있는 경우만 계산합니다.</p>
      <div className="fit-grid">
        <FitList title="지원자격 충족" items={fit.eligibleMatches} empty="확인 필요" />
        <FitList title="인정되는 보유 자격" items={fit.recognizedCredentials} empty="일치 항목 없음" />
        <FitList title="공고 명시 가점" items={fit.bonusMatches} empty="명시 점수 없음" />
        <FitList title="우대사항" items={fit.preferredMatches} empty="해당 항목 없음" />
        <FitList title="부족한 자격요건" items={fit.missingRequirements} empty="추가 확인 필요" />
      </div>
    </div>
  );
}

function FitList({ title, items, empty }) {
  return (
    <div>
      <strong>{title}</strong>
      <ul className="clean-list">
        {(items.length ? items : [empty]).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function analyzeFit(result, credentials) {
  const role = result?.position || result?.selectedRole;
  const roleData = result?.roleRequirements?.[role] || result?.selectedRoleRequirements || {};
  const credentialText = credentials.map((credential) => `${credential.name} ${credential.grade} ${credential.score}`.trim());
  const hasCredential = (text) => credentialText.some((credential) => matchesCredentialRule(credential, text));
  const eligibility = roleData.eligibility || [];
  const preferred = roleData.preferred || [];
  const bonusItems = roleData.bonusItems || [];

  const eligibleMatches = eligibility.filter(hasCredential);
  const preferredMatches = preferred.filter(hasCredential).map((item) => `${item} → 우대사항 해당`);
  const bonusMatches = bonusItems
    .filter((item) => hasCredential(item.name))
    .map((item) => item.points ? `${item.name} → 가점 대상 +${item.points}점` : `${item.name} → 가점 여부 확인 필요`);
  const explicitBonusPoints = bonusItems
    .filter((item) => item.points && hasCredential(item.name))
    .reduce((sum, item) => sum + Number(item.points), 0);
  const recognizedCredentials = [...eligibleMatches, ...preferredMatches, ...bonusMatches].map((item) => item.replace(/ → .+$/, ""));
  const missingRequirements = [...eligibility.filter((item) => !hasCredential(item)), ...(roleData.missingCheckpoints || [])];

  return {
    eligibleMatches,
    recognizedCredentials: Array.from(new Set(recognizedCredentials)),
    bonusMatches,
    preferredMatches,
    missingRequirements,
    explicitBonusPoints
  };
}

function normalize(value) {
  return String(value || "").replace(/\s/g, "").toLowerCase();
}

function matchesCredentialRule(credential, rule) {
  const normalizedCredential = normalize(credential);
  const normalizedRule = normalize(rule);
  if (normalizedCredential.includes(normalizedRule) || normalizedRule.includes(normalizedCredential)) return true;

  const credentialScore = Number((String(credential).match(/\d+/) || [])[0]);
  const ruleScore = Number((String(rule).match(/\d+/) || [])[0]);
  const examName = String(rule).match(/[A-Za-z가-힣]+/)?.[0] || "";
  if (examName && normalizedCredential.includes(normalize(examName)) && credentialScore && ruleScore) {
    return credentialScore >= ruleScore;
  }
  return false;
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
          <span key={item}>{item}<button type="button" onClick={() => onRemove(name, item)} title="삭제">x</button></span>
        ))}
      </div>
    </div>
  );
}

export default AnalysisResultEditor;
