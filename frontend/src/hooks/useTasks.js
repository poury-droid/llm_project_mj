import { useState } from "react";
import { api } from "../services/api.js";

// 체크리스트 추가/수정/삭제 로직을 상세 페이지와 분석 페이지에서 재사용하기 위한 hook입니다.
export function useTasks(applicationId, onChanged) {
  const [saving, setSaving] = useState(false);

  async function run(work) {
    setSaving(true);
    try {
      const result = await work();
      if (onChanged) await onChanged();
      return result;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    addTask: (payload) => run(() => api.createTask(applicationId, payload)),
    updateTask: (taskId, payload) => run(() => api.updateTask(taskId, payload)),
    deleteTask: (taskId) => run(() => api.deleteTask(taskId))
  };
}
