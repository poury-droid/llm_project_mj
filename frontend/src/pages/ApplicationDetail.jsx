import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ApplicationDdayList from "../components/ApplicationDdayList.jsx";
import ApplicationFormFields, { stages } from "../components/ApplicationFormFields.jsx";
import TaskList from "../components/TaskList.jsx";
import { useApplications } from "../hooks/useApplications.js";
import { useTasks } from "../hooks/useTasks.js";
import { api } from "../services/api.js";

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshApplications } = useApplications();
  const [application, setApplication] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", category: "사용자정의", dueDate: "", priority: "normal" });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setApplication(await api.getApplication(id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const taskActions = useTasks(id, async () => {
    await load();
    await refreshApplications();
  });

  const progress = useMemo(() => {
    const total = application?.tasks?.length || 0;
    const done = application?.tasks?.filter((task) => task.completed).length || 0;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [application]);

  async function addTask(event) {
    event.preventDefault();
    await taskActions.addTask(taskForm);
    setTaskForm({ title: "", category: "사용자정의", dueDate: "", priority: "normal" });
    setFeedback("할 일이 추가되었습니다.");
  }

  async function toggleTask(task, completed) {
    await taskActions.updateTask(task.id, { completed });
    setFeedback(`${task.title} ${completed ? "완료" : "완료 취소"} · 남은 준비사항이 다시 계산되었습니다.`);
  }

  async function changeStage(stage) {
    const updated = await api.updateApplication(id, { ...application, stage });
    setApplication(updated);
    const created = await api.addStageChecklist(id);
    await load();
    await refreshApplications();
    setFeedback(`${stage} 단계로 변경했습니다. 기본 체크리스트 ${created.length}개를 제안해 추가했습니다.`);
  }

  async function deleteApplication() {
    await api.deleteApplication(id);
    await refreshApplications();
    navigate("/applications");
  }

  if (error) return <p className="error">{error}</p>;
  if (!application) return <p>상세 정보를 불러오는 중입니다.</p>;

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>{application.company}</h1>
          <p>{application.position} · {application.stage}</p>
        </div>
        <div className="actions">
          <Link className="button secondary" to={`/applications/${id}/edit`}>수정</Link>
          <button className="button danger-button" onClick={deleteApplication}>삭제</button>
        </div>
      </div>

      {feedback && <p className="success">{feedback}</p>}

      <div className="panel">
        <div className="stage-control">
          <label>
            현재 전형 단계
            <select value={application.stage} onChange={(event) => changeStage(event.target.value)}>
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </label>
          <div className="progress-box">
            <strong>준비 진행률 {progress.done} / {progress.total}</strong>
            <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
            <small>{progress.percent}% 완료</small>
          </div>
          {application.stage === "필기전형" && <Link className="button" to={`/applications/${id}/study-plan`}>공부계획 만들기</Link>}
        </div>
      </div>

      <div className="two-column">
        <div className="panel">
          <h2>단계별 D-Day</h2>
          <ApplicationDdayList application={application} />
          <Info label="장소" value={application.location || "-"} />
        </div>
        <div className="panel">
          <h2>제출서류와 과목</h2>
          <TagList items={application.requiredDocuments} empty="등록된 제출서류가 없습니다." />
          <h3>필기시험 과목</h3>
          <TagList items={application.subjects} empty="등록된 과목이 없습니다." />
        </div>
      </div>

      <div className="panel">
        <h2>빠른 정보 수정</h2>
        <ApplicationFormFields form={application} setForm={setApplication} />
        <button className="button" onClick={async () => { await api.updateApplication(id, application); await refreshApplications(); setFeedback("지원 공고 정보가 저장되었습니다."); }}>변경사항 저장</button>
      </div>

      <div className="panel">
        <div className="section-header">
          <h2>체크리스트</h2>
          <button className="button secondary" onClick={async () => { const created = await api.addStageChecklist(id); await load(); setFeedback(`현재 단계 기본 체크리스트 ${created.length}개를 추가했습니다.`); }}>현재 단계 기본 체크리스트 추가</button>
        </div>
        <form className="inline-form" onSubmit={addTask}>
          <input placeholder="직접 할 일 추가" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
          <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} />
          <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
            <option value="low">low</option>
            <option value="normal">normal</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          <button className="button" type="submit">추가</button>
        </form>
        <TaskList
          tasks={application.tasks}
          onToggle={toggleTask}
          onUpdate={taskActions.updateTask}
          onDelete={taskActions.deleteTask}
        />
      </div>

      <div className="panel">
        <h2>메모</h2>
        <p>{application.memo || "메모가 없습니다."}</p>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return <div className="info-row"><strong>{label}</strong><span>{value}</span></div>;
}

function TagList({ items, empty }) {
  if (!items?.length) return <p className="empty">{empty}</p>;
  return <div className="tags">{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

export default ApplicationDetail;
