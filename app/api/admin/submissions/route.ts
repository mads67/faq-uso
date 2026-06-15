import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateToken } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Get all submissions with questions and documents
  const { data: respuestas, error: rErr } = await supabaseAdmin
    .from("faq_respuestas")
    .select("id, nombre, correo, unidad, cargo, cargo_otro, sugerencias, created_at")
    .order("created_at", { ascending: false });

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const respuestasIds = respuestas.map((r: { id: any }) => r.id);

  // Fetch preguntas
  const { data: preguntas } = await supabaseAdmin
    .from("faq_preguntas")
    .select("respuesta_id, numero, pregunta, respuesta, categoria")
    .in("respuesta_id", respuestasIds);

  // Fetch documentos
  const { data: documentos } = await supabaseAdmin
    .from("faq_documentos")
    .select("respuesta_id, nombre_archivo, storage_path, indicaciones, created_at")
    .in("respuesta_id", respuestasIds);

  const preguntasMap: Record<string, any[]> = {};
  for (const p of preguntas || []) {
    if (!preguntasMap[p.respuesta_id]) {
      preguntasMap[p.respuesta_id] = [];
    }
    preguntasMap[p.respuesta_id].push(p);
  }

  const docsMap: Record<string, any[]> = {};
  for (const d of documentos || []) {
    if (!docsMap[d.respuesta_id]) {
      docsMap[d.respuesta_id] = [];
    }
    docsMap[d.respuesta_id].push(d);
  }

  const data = respuestas.map((r: any) => ({
    ...r,
    preguntas: preguntasMap[r.id] || [],
    documentos: docsMap[r.id] || [],
  }));

  // Metrics
  const totalSubmissions = data.length;
  const totalPreguntas = (preguntas || []).length;
  const totalDocs = (documentos || []).length;

  return NextResponse.json({
    metrics: {
      totalSubmissions,
      totalPreguntas,
      totalDocs,
    },
    submissions: data,
  });
}
