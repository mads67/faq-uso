import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validateToken } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !validateToken(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // ── Formulario personal ──
  const { data: respuestas, error: rErr } = await supabaseAdmin
    .from("faq_respuestas")
    .select("id, nombre, correo, unidad, cargo, cargo_otro, sugerencias, created_at")
    .order("created_at", { ascending: false });

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const respuestasIds = respuestas.map((r: { id: string }) => r.id);

  const { data: preguntas } = await supabaseAdmin
    .from("faq_preguntas")
    .select("respuesta_id, numero, pregunta, respuesta, categoria")
    .in("respuesta_id", respuestasIds.length ? respuestasIds : ["__none__"]);

  const { data: documentos } = await supabaseAdmin
    .from("faq_documentos")
    .select("respuesta_id, nombre_archivo, storage_path, indicaciones, created_at")
    .in("respuesta_id", respuestasIds.length ? respuestasIds : ["__none__"]);

  const preguntasMap: Record<string, object[]> = {};
  for (const p of preguntas || []) {
    if (!preguntasMap[p.respuesta_id]) preguntasMap[p.respuesta_id] = [];
    preguntasMap[p.respuesta_id].push(p);
  }
  const docsMap: Record<string, object[]> = {};
  for (const d of documentos || []) {
    if (!docsMap[d.respuesta_id]) docsMap[d.respuesta_id] = [];
    docsMap[d.respuesta_id].push(d);
  }

  const submissions = respuestas.map((r: Record<string, unknown>) => ({
    ...r,
    preguntas: preguntasMap[r.id as string] || [],
    documentos: docsMap[r.id as string] || [],
  }));

  // ── Cuestionario estudiantes ──
  const { data: cuestionariosRaw, error: cErr } = await supabaseAdmin
    .from("cuestionario_respuestas")
    .select("id, condicion, año_academico, medios, tramites, created_at")
    .order("created_at", { ascending: false });

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  type CuestionarioRow = {
    id: string; condicion: string; año_academico: string | null;
    medios: string[]; tramites: string[]; created_at: string;
  };
  const cuestionarios = (cuestionariosRaw ?? []) as unknown as CuestionarioRow[];

  const cuestionarioIds = cuestionarios.map((c) => c.id);

  const { data: comentarios } = await supabaseAdmin
    .from("cuestionario_comentarios")
    .select("respuesta_id, numero, comentario")
    .in("respuesta_id", cuestionarioIds.length ? cuestionarioIds : ["__none__"]);

  const comentariosMap: Record<string, object[]> = {};
  for (const c of comentarios || []) {
    if (!comentariosMap[c.respuesta_id]) comentariosMap[c.respuesta_id] = [];
    comentariosMap[c.respuesta_id].push(c);
  }

  const cuestionariosData = cuestionarios.map((c) => ({
    ...c,
    comentarios: comentariosMap[c.id] || [],
  }));

  return NextResponse.json({
    metrics: {
      totalSubmissions: submissions.length,
      totalPreguntas: (preguntas || []).length,
      totalDocs: (documentos || []).length,
      totalCuestionarios: cuestionariosData.length,
      totalComentarios: (comentarios || []).length,
    },
    submissions,
    cuestionarios: cuestionariosData,
  });
}
