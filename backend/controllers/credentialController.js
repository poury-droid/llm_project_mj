import * as credentialRepo from "../repositories/credentialRepository.js";

export async function getCredentials(req, res) {
  res.json(await credentialRepo.findAllCredentials(req.user.id));
}

export async function createCredential(req, res) {
  if (!req.body.name) return res.status(400).json({ message: "자격증명 또는 시험명을 입력하세요." });
  const saved = await credentialRepo.createCredential(req.user.id, req.body);
  res.status(201).json(saved);
}

export async function updateCredential(req, res) {
  const updated = await credentialRepo.updateCredential(req.user.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "자격 정보를 찾을 수 없습니다." });
  res.json(updated);
}

export async function deleteCredential(req, res) {
  const deleted = await credentialRepo.deleteCredential(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ message: "자격 정보를 찾을 수 없습니다." });
  res.status(204).send();
}
