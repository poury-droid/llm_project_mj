import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ApplicationFormFields, { stages } from "../components/ApplicationFormFields.jsx";
import { useApplications } from "../hooks/useApplications.js";
import { api } from "../services/api.js";

const emptyForm = {
  company: "",
  position: "",
  title: "",
  deadline: "",
  stage: stages[1],
  pdfFileName: "",
  memo: "",
  writtenTestDate: "",
  interviewDate: "",
  replyDeadline: "",
  location: "",
  subjects: [],
  requiredDocuments: []
};

function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshApplications } = useApplications();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) api.getApplication(id).then((data) => setForm(data)).catch((err) => setError(err.message));
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const saved = id ? await api.updateApplication(id, form) : await api.createApplication(form);
      await refreshApplications();
      navigate(`/applications/${saved.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="page-title">
        <h1>{id ? "지원 공고 수정" : "지원 공고 등록"}</h1>
      </div>
      {error && <p className="error">{error}</p>}
      <form className="panel" onSubmit={handleSubmit}>
        <ApplicationFormFields form={form} setForm={setForm} />
        <div className="actions">
          <button className="button" type="submit">저장</button>
        </div>
      </form>
    </section>
  );
}

export default ApplicationForm;
