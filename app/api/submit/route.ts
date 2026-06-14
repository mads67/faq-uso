import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureTables } from "@/lib/sync-schema";

export async function POST(req: NextRequest) {
  try {
    const sync = await ensureTables();
    if (!sync.ok) {
      console.warn("[schema] Auto-sync warning:", sync.error);
    }

    const body = await req.json();
    const { nombre, correo, unidad, cargo, cargo_otro, modo, preguntas, sugerencias, session_id } = body;

    // Insert respondente record
    const { data: respuesta, error: respErr } = await supabaseAdmin
      .from("faq_respuestas")
      .insert({
        session_id: session_id ?? null,
        nombre,
        correo: correo || null,
        unidad,
        cargo,
        cargo_otro: cargo_otro ?? null,
        modo,
        sugerencias: sugerencias ?? null,
      })
      .select("id")
      .single();

    if (respErr) throw respErr;

    // Insert individual Q&A rows (manual mode)
    if (modo === "manual" && Array.isArray(preguntas) && preguntas.length > 0) {
      const rows = preguntas.map((p: { pregunta: string; respuesta: string; categoria: string }, i: number) => ({
        respuesta_id: respuesta.id,
        numero: i + 1,
        pregunta: p.pregunta,
        respuesta: p.respuesta,
        categoria: p.categoria || null,
      }));
      const { error: qErr } = await supabaseAdmin.from("faq_preguntas").insert(rows);
      if (qErr) throw qErr;
    }

    return NextResponse.json({ id: respuesta.id });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Error interno";
    console.error("[submit]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
