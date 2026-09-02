import React, { useState } from "react";
import DdayBadge from "./DdayBadge.jsx";

function TaskList({ tasks, onToggle, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState(null);

  if (!tasks?.length) return <p className="empty">체크리스트가 없습니다.</p>;

  function startEdit(task) {
    setEditingId(task.id);
    setDraft({ title: task.title, dueDate: task.dueDate || "", priority: task.priority, category: task.category });
  }

  async function saveEdit(taskId) {
    await onUpdate(taskId, draft);
    setEditingId("");
    setDraft(null);
  }

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const isEditing = editingId === task.id;
        return (
          <div className={`task-row ${task.completed ? "done" : ""}`} key={task.id}>
            {isEditing ? (
              <>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
                <input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
                <button className="icon-button" onClick={() => saveEdit(task.id)} title="저장">✓</button>
              </>
            ) : (
              <>
                <label>
                  <input type="checkbox" checked={task.completed} onChange={(event) => onToggle(task, event.target.checked)} />
                  <span>{task.title}</span>
                </label>
                <span className="muted">{task.category}</span>
                <DdayBadge date={task.dueDate} />
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => startEdit(task)} title="수정">✎</button>
                  <button className="icon-button" onClick={() => onDelete(task.id)} title="삭제">×</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
