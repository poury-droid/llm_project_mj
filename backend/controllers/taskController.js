import * as taskRepo from "../repositories/taskRepository.js";

export async function getTasks(req, res) {
  const tasks = await taskRepo.findTasksByApplicationId(req.params.id);
  res.json(tasks);
}

export async function createTask(req, res) {
  const task = {
    id: crypto.randomUUID(),
    applicationId: req.params.id,
    title: req.body.title,
    category: req.body.category || "사용자정의",
    dueDate: req.body.dueDate || "",
    completed: Boolean(req.body.completed),
    priority: req.body.priority || "normal",
    createdAt: new Date().toISOString()
  };
  const saved = await taskRepo.createTask(task);
  res.status(201).json(saved);
}

export async function updateTask(req, res) {
  const updated = await taskRepo.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.json(updated);
}

export async function deleteTask(req, res) {
  const deleted = await taskRepo.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ message: "체크리스트를 찾을 수 없습니다." });
  res.status(204).send();
}
