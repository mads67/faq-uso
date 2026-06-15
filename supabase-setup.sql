-- ============================================================
-- FAQ USO — Setup completo desde cero
-- Ejecuta en: Supabase → SQL Editor → New Query
-- ============================================================

-- 0. Drop de tablas existentes (orden inverso por FK)
DROP VIEW IF EXISTS faq_completo;
DROP TABLE IF EXISTS faq_documentos;
DROP TABLE IF EXISTS faq_preguntas;
DROP TABLE IF EXISTS faq_respuestas;

-- 1. Función helper para auto-sync
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Tabla de respuestas
CREATE TABLE IF NOT EXISTS faq_respuestas (
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

-- 2. Tabla de preguntas
CREATE TABLE IF NOT EXISTS faq_preguntas (
  id           bigint   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  respuesta_id bigint   NOT NULL REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  numero       smallint NOT NULL,
  pregunta     text     NOT NULL,
  respuesta    text     NOT NULL,
  categoria    text
);

-- 3. Tabla de documentos
CREATE TABLE IF NOT EXISTS faq_documentos (
  id             bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  respuesta_id   bigint      NOT NULL REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  nombre_archivo text        NOT NULL,
  storage_path   text        NOT NULL,
  indicaciones   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. Bucket de storage
INSERT INTO storage.buckets (id, name, public)
  SELECT 'faq-documentos', 'faq-documentos', false
  WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'faq-documentos');

-- 5. Políticas RLS públicas (formulario abierto)
ALTER TABLE faq_respuestas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_preguntas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_documentos  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_respuestas" ON faq_respuestas;
DROP POLICY IF EXISTS "insert_preguntas"  ON faq_preguntas;
DROP POLICY IF EXISTS "insert_documentos" ON faq_documentos;
DROP POLICY IF EXISTS "select_respuestas" ON faq_respuestas;
DROP POLICY IF EXISTS "select_preguntas"  ON faq_preguntas;
DROP POLICY IF EXISTS "select_documentos" ON faq_documentos;

CREATE POLICY "insert_respuestas" ON faq_respuestas FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_preguntas"  ON faq_preguntas  FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_documentos" ON faq_documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "select_respuestas" ON faq_respuestas FOR SELECT USING (true);
CREATE POLICY "select_preguntas"  ON faq_preguntas  FOR SELECT USING (true);
CREATE POLICY "select_documentos" ON faq_documentos FOR SELECT USING (true);

-- 6. Políticas de Storage
DROP POLICY IF EXISTS "upload_faq_docs" ON storage.objects;
DROP POLICY IF EXISTS "select_faq_docs" ON storage.objects;

CREATE POLICY "upload_faq_docs"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'faq-documentos');

CREATE POLICY "select_faq_docs"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'faq-documentos');
