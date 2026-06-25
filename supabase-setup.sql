-- ============================================================
-- FAQ USO — Schema inicial completo
-- Universidad de Sonsonate — Chatbot de atención estudiantil
-- Ejecuta en: Supabase → SQL Editor → New Query
-- ============================================================

-- Drop de tablas y vistas (orden inverso por FK)
DROP VIEW  IF EXISTS faq_completo;
DROP TABLE IF EXISTS cuestionario_comentarios;
DROP TABLE IF EXISTS cuestionario_respuestas;
DROP TABLE IF EXISTS faq_documentos;
DROP TABLE IF EXISTS faq_preguntas;
DROP TABLE IF EXISTS faq_respuestas;

-- ════════════════════════════════════════════════════════════
-- FORMULARIO PERSONAL (personal/page.tsx → FormFAQ.tsx)
-- ════════════════════════════════════════════════════════════

-- 1. Respuestas del formulario personal
CREATE TABLE faq_respuestas (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text,
  nombre      text        NOT NULL,
  correo      text,
  unidad      text        NOT NULL,
  cargo       text        NOT NULL,
  cargo_otro  text,
  sugerencias text
);

-- 2. Preguntas asociadas a cada respuesta personal
CREATE TABLE faq_preguntas (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  respuesta_id bigint      NOT NULL REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  numero       smallint    NOT NULL,
  pregunta     text        NOT NULL,
  respuesta    text        NOT NULL,
  categoria    text
);

-- 3. Documentos adjuntos a cada respuesta personal
CREATE TABLE faq_documentos (
  id             bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at     timestamptz NOT NULL DEFAULT now(),
  respuesta_id   bigint      NOT NULL REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  nombre_archivo text        NOT NULL,
  storage_path   text        NOT NULL,
  indicaciones   text
);

-- ════════════════════════════════════════════════════════════
-- CUESTIONARIO ESTUDIANTES (estudiantes/page.tsx → FormCuestionario.tsx)
-- ════════════════════════════════════════════════════════════

-- 4. Respuestas del cuestionario estudiantil
CREATE TABLE cuestionario_respuestas (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  condicion  text        NOT NULL,
  medios     text[]      NOT NULL,
  tramites   text[]      NOT NULL
);

-- 5. Consultas frecuentes escritas por el estudiante (1-3 items)
CREATE TABLE cuestionario_comentarios (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),
  respuesta_id bigint      NOT NULL REFERENCES cuestionario_respuestas(id) ON DELETE CASCADE,
  numero       smallint    NOT NULL,
  comentario   text        NOT NULL
);

-- ════════════════════════════════════════════════════════════
-- INDICES
-- ════════════════════════════════════════════════════════════

CREATE INDEX ON faq_preguntas            (respuesta_id);
CREATE INDEX ON faq_documentos           (respuesta_id);
CREATE INDEX ON cuestionario_comentarios (respuesta_id);

-- ════════════════════════════════════════════════════════════
-- STORAGE — bucket privado para documentos adjuntos
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
  SELECT 'faq-documentos', 'faq-documentos', false
  WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'faq-documentos');

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- El formulario es publico (anon puede insertar).
-- Las lecturas y eliminaciones se hacen desde el servidor con
-- SUPABASE_SERVICE_ROLE_KEY, que bypasea RLS automaticamente.
-- ════════════════════════════════════════════════════════════

ALTER TABLE faq_respuestas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_preguntas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_documentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuestionario_respuestas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuestionario_comentarios ENABLE ROW LEVEL SECURITY;

-- Politicas INSERT publicas (formularios abiertos, anon puede enviar)
CREATE POLICY "insert_faq_respuestas"
  ON faq_respuestas FOR INSERT WITH CHECK (true);

CREATE POLICY "insert_faq_preguntas"
  ON faq_preguntas FOR INSERT WITH CHECK (true);

CREATE POLICY "insert_faq_documentos"
  ON faq_documentos FOR INSERT WITH CHECK (true);

CREATE POLICY "insert_cuestionario_respuestas"
  ON cuestionario_respuestas FOR INSERT WITH CHECK (true);

CREATE POLICY "insert_cuestionario_comentarios"
  ON cuestionario_comentarios FOR INSERT WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- STORAGE POLICIES — subida de archivos via signed URL
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "upload_faq_docs" ON storage.objects;
DROP POLICY IF EXISTS "select_faq_docs" ON storage.objects;

CREATE POLICY "upload_faq_docs"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'faq-documentos');

CREATE POLICY "select_faq_docs"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'faq-documentos');
