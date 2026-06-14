import { supabaseAdmin } from "./supabase";

interface ColumnDef {
  name: string;
  definition: string;
}

const TABLES: Record<string, { create: string; columns: ColumnDef[] }> = {
  faq_respuestas: {
    create: `
      CREATE TABLE IF NOT EXISTS public.faq_respuestas (
        id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        session_id  text,
        nombre      text NOT NULL,
        correo      text,
        unidad      text NOT NULL,
        cargo       text NOT NULL,
        cargo_otro  text,
        modo        text NOT NULL CHECK (modo IN ('manual', 'doc')),
        sugerencias text,
        created_at  timestamptz NOT NULL DEFAULT now()
      );
    `,
    columns: [
      { name: "id", definition: "bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY" },
      { name: "session_id", definition: "text" },
      { name: "nombre", definition: "text NOT NULL" },
      { name: "correo", definition: "text" },
      { name: "unidad", definition: "text NOT NULL" },
      { name: "cargo", definition: "text NOT NULL" },
      { name: "cargo_otro", definition: "text" },
      { name: "modo", definition: "text NOT NULL CHECK (modo IN ('manual', 'doc'))" },
      { name: "sugerencias", definition: "text" },
      { name: "created_at", definition: "timestamptz NOT NULL DEFAULT now()" },
    ],
  },
  faq_preguntas: {
    create: `
      CREATE TABLE IF NOT EXISTS public.faq_preguntas (
        id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        respuesta_id  bigint NOT NULL REFERENCES public.faq_respuestas(id) ON DELETE CASCADE,
        numero        smallint NOT NULL,
        pregunta      text NOT NULL,
        respuesta     text NOT NULL,
        categoria     text
      );
    `,
    columns: [
      { name: "id", definition: "bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY" },
      { name: "respuesta_id", definition: "bigint NOT NULL REFERENCES public.faq_respuestas(id) ON DELETE CASCADE" },
      { name: "numero", definition: "smallint NOT NULL" },
      { name: "pregunta", definition: "text NOT NULL" },
      { name: "respuesta", definition: "text NOT NULL" },
      { name: "categoria", definition: "text" },
    ],
  },
  faq_documentos: {
    create: `
      CREATE TABLE IF NOT EXISTS public.faq_documentos (
        id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        respuesta_id   bigint NOT NULL REFERENCES public.faq_respuestas(id) ON DELETE CASCADE,
        nombre_archivo text NOT NULL,
        storage_path   text NOT NULL,
        indicaciones   text,
        created_at     timestamptz NOT NULL DEFAULT now()
      );
    `,
    columns: [
      { name: "id", definition: "bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY" },
      { name: "respuesta_id", definition: "bigint NOT NULL REFERENCES public.faq_respuestas(id) ON DELETE CASCADE" },
      { name: "nombre_archivo", definition: "text NOT NULL" },
      { name: "storage_path", definition: "text NOT NULL" },
      { name: "indicaciones", definition: "text" },
      { name: "created_at", definition: "timestamptz NOT NULL DEFAULT now()" },
    ],
  },
};

let synced = false;

async function exec(sql: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin.rpc("exec_sql", { sql });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function ensureExecSql(): Promise<boolean> {
  const { error } = await supabaseAdmin.rpc("exec_sql", {
    sql: `SELECT 1`,
  });
  if (!error) return true;

  // Try creating the function
  const { error: createErr } = await supabaseAdmin.rpc("exec_sql", {
    sql: `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
      RETURNS void AS $$
      BEGIN EXECUTE sql; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `,
  });

  if (createErr && !createErr.message.includes("already exists")) {
    return false;
  }
  return true;
}

async function ensureTable(name: string, def: typeof TABLES[string]): Promise<{ ok: boolean; error?: string }> {
  // 1. Try creating the table (safe if already exists)
  const create = await exec(def.create);
  if (!create.ok) return create;

  // 2. Add any missing columns (safe — IF NOT EXISTS skips existing ones)
  for (const col of def.columns) {
    const alter = await exec(
      `ALTER TABLE public.${name} ADD COLUMN IF NOT EXISTS ${col.name} ${col.definition};`
    );
    if (!alter.ok) return alter;
  }

  // 3. Ensure CHECK constraint on modo — safely, without dropping existing data
  if (name === "faq_respuestas") {
    // Only add the constraint if it doesn't exist; don't force drop/recreate
    // to avoid conflicts with existing data or different constraint names.
    await exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'public.faq_respuestas'::regclass
          AND conname LIKE '%modo%check%'
        ) THEN
          ALTER TABLE public.faq_respuestas
            ADD CONSTRAINT faq_respuestas_modo_check
            CHECK (modo IN ('manual', 'doc'));
        END IF;
      END $$;
    `);
  }

  return { ok: true };
}

export async function ensureTables(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (synced) return { ok: true };

  // First make sure exec_sql function exists
  const fnReady = await ensureExecSql();
  if (!fnReady) {
    return {
      ok: false,
      error:
        "No se pudo crear la función 'exec_sql'. " +
        "Ejecutá 'supabase-schema.sql' en el SQL Editor de Supabase para crearla manualmente.",
    };
  }

  // Ensure each table
  for (const [name, def] of Object.entries(TABLES)) {
    const result = await ensureTable(name, def);
    if (!result.ok) {
      return { ok: false, error: `Error en tabla '${name}': ${result.error}` };
    }
  }

  synced = true;
  return { ok: true };
}
