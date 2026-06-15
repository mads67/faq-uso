import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { respuestaId, fileName, storagePath, indicaciones } =
      await req.json();

    if (!respuestaId || !fileName || !storagePath) {
      return NextResponse.json(
        { error: "Faltan parámetros" },
        { status: 400 }
      );
    }

    // Verifica que el archivo realmente existe en storage antes de registrar en BD
    const folder = storagePath.split("/")[0];
    const file   = storagePath.split("/")[1];
    const { data: exists, error: checkErr } = await supabaseAdmin.storage
      .from("faq-documentos")
      .list(folder, { search: file });

    if (checkErr || !exists?.length) {
      return NextResponse.json(
        { error: "El archivo no se encontró en storage" },
        { status: 404 }
      );
    }

    const { error: dbErr } = await supabaseAdmin
      .from("faq_documentos")
      .insert({
        respuesta_id: respuestaId,
        nombre_archivo: fileName,
        storage_path: storagePath,
        indicaciones: indicaciones || null,
      });

    if (dbErr) throw dbErr;

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
