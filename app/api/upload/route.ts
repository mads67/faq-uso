import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "faq-documentos";
const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const respuestaId = form.get("respuesta_id") as string | null;
    const indicaciones = (form.get("indicaciones") as string | null) ?? "";

    if (!file || !respuestaId) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `"${file.name}" supera 50 MB` }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `"${file.name}" no es un tipo permitido (PDF, Word o Excel)` }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${respuestaId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadErr) throw uploadErr;

    const { error: dbErr } = await supabaseAdmin.from("faq_documentos").insert({
      respuesta_id: respuestaId,
      nombre_archivo: file.name,
      storage_path: path,
      indicaciones: indicaciones || null,
    });

    if (dbErr) throw dbErr;

    return NextResponse.json({ ok: true, path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
