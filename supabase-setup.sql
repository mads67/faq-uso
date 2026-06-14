-- ============================================================
-- FAQ USO — Setup completo desde cero
-- Ejecuta en: Supabase → SQL Editor → New Query
-- ============================================================

-- 0. Función helper para auto-sync
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Tabla de respuestas
CREATE TABLE IF NOT EXISTS faq_respuestas (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  session_id  text,
  nombre      text        NOT NULL,
  correo      text,                           -- opcional
  unidad      text        NOT NULL,
  cargo       text        NOT NULL,
  cargo_otro  text,
  modo        text        NOT NULL CHECK (modo IN ('manual', 'doc')),
  sugerencias text
);

-- 2. Tabla de preguntas (modo manual)
CREATE TABLE IF NOT EXISTS faq_preguntas (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  respuesta_id uuid        REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  numero       integer     NOT NULL,
  pregunta     text        NOT NULL,
  respuesta    text        NOT NULL,
  categoria    text
);

-- 3. Tabla de documentos (modo documento)
CREATE TABLE IF NOT EXISTS faq_documentos (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz DEFAULT now(),
  respuesta_id   uuid        REFERENCES faq_respuestas(id) ON DELETE CASCADE,
  nombre_archivo text        NOT NULL,
  storage_path   text        NOT NULL,
  indicaciones   text
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

-- 7. Vista combinada para exportar
DROP VIEW IF EXISTS faq_completo;
CREATE VIEW faq_completo AS
  SELECT
    r.id,
    r.created_at,
    r.session_id,
    r.nombre,
    r.correo,
    r.unidad,
    r.cargo,
    r.cargo_otro,
    r.modo,
    r.sugerencias,
    p.numero       AS pregunta_numero,
    p.pregunta,
    p.respuesta,
    p.categoria,
    d.nombre_archivo,
    d.storage_path,
    d.indicaciones AS doc_indicaciones
  FROM faq_respuestas r
  LEFT JOIN faq_preguntas  p ON p.respuesta_id = r.id
  LEFT JOIN faq_documentos d ON d.respuesta_id = r.id
  ORDER BY r.created_at DESC, p.numero;

GRANT SELECT ON faq_completo TO anon;
