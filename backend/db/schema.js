// 서버 시작 시 필요한 테이블과 인덱스를 멱등적으로 생성합니다.
import { query } from "./pool.js";

export async function ensureDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL
    );
  `);

  await query("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);");

  // 지원 공고의 기본 정보입니다. 배열 형태 데이터는 JSONB로 저장합니다.
  await query(`
    CREATE TABLE IF NOT EXISTS applications (
      id text PRIMARY KEY,
      company text NOT NULL,
      position text NOT NULL,
      title text NOT NULL,
      deadline text NOT NULL DEFAULT '',
      stage text NOT NULL DEFAULT '',
      pdf_file_name text NOT NULL DEFAULT '',
      memo text NOT NULL DEFAULT '',
      written_test_date text NOT NULL DEFAULT '',
      interview_date text NOT NULL DEFAULT '',
      reply_deadline text NOT NULL DEFAULT '',
      location text NOT NULL DEFAULT '',
      subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
      required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
  `);

  // 지원 공고에 속한 할 일입니다.
  // application_id 외래키와 CASCADE로 공고 삭제 시 관련 할 일도 삭제됩니다.
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY,
      application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      title text NOT NULL,
      category text NOT NULL DEFAULT '',
      due_date text NOT NULL DEFAULT '',
      completed boolean NOT NULL DEFAULT false,
      priority text NOT NULL DEFAULT 'normal',
      created_at text NOT NULL
    );
  `);

  // 공고 하나당 학습 계획 하나만 허용합니다(application_id UNIQUE).
  await query(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id text PRIMARY KEY,
      application_id text NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
      exam_date text NOT NULL DEFAULT '',
      weekday_hours integer NOT NULL DEFAULT 0,
      weekend_hours integer NOT NULL DEFAULT 0,
      subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
      available_days jsonb NOT NULL DEFAULT '[]'::jsonb,
      excluded_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
      days jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
  `);

  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'application';");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS personal_exam_id text;");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS exam_name text NOT NULL DEFAULT '';");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS target text NOT NULL DEFAULT '';");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS current_level text NOT NULL DEFAULT '';");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS phase_mode text NOT NULL DEFAULT 'auto';");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS manual_phases jsonb NOT NULL DEFAULT '[]'::jsonb;");
  await query("ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS progress jsonb NOT NULL DEFAULT '{\"total\":0,\"done\":0,\"percent\":0,\"bySubject\":{}}'::jsonb;");
  await query("ALTER TABLE study_plans ALTER COLUMN application_id DROP NOT NULL;");

  await query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id text PRIMARY KEY,
      name text NOT NULL,
      grade text NOT NULL DEFAULT '',
      acquired_date text NOT NULL DEFAULT '',
      expires_at text NOT NULL DEFAULT '',
      score text NOT NULL DEFAULT '',
      issuer text NOT NULL DEFAULT '',
      memo text NOT NULL DEFAULT '',
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
  `);

  // 자주 조회하는 컬럼에 인덱스를 만들어 목록/마감일 조회를 빠르게 합니다.
  await query("CREATE INDEX IF NOT EXISTS idx_tasks_application_id ON tasks(application_id);");
  await query("CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);");
  await query("CREATE INDEX IF NOT EXISTS idx_applications_deadline ON applications(deadline);");
  await query("CREATE INDEX IF NOT EXISTS idx_study_plans_type ON study_plans(type);");
  await query("CREATE INDEX IF NOT EXISTS idx_study_plans_personal_exam_id ON study_plans(personal_exam_id);");
}
