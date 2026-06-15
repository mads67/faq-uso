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
    const { fileName, fileType, fileSize, respuestaId } = await req.json();

    if (!fileName || !fileType || !respuestaId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: `"${fileName}" supera 50 MB` },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: `"${fileName}" no es un tipo permitido (PDF, Word o Excel)` },
        { status: 400 }
      );
    }

    const ext = fileName.split(".").pop() ?? "bin";
    const path = `${respuestaId}/${crypto.randomUUID()}.${ext}`;

    // Solo genera la signed URL — sin insertar en BD todavía
    const { data, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (signedErr) throw signedErr;

    return NextResponse.json({ ok: true, signedUrl: data.signedUrl, path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
