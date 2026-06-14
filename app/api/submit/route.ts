import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, correo, unidad, cargo, cargo_otro, modo, preguntas } = body;

    // Insert respondente record
    const { data: respuesta, error: respErr } = await supabaseAdmin
      .from("respuestas")
      .insert({ nombre, correo, unidad, cargo, cargo_otro: cargo_otro ?? null, modo })
      .select("id")
      .single();

    if (respErr) throw respErr;

    // Insert individual Q&A rows (manual mode)
    if (modo === "manual" && Array.isArray(preguntas) && preguntas.length > 0) {
      const rows = preguntas.map((p: { pregunta: string; respuesta: string; categoria: string }) => ({
        respuesta_id: respuesta.id,
        pregunta: p.pregunta,
        respuesta: p.respuesta,
        categoria: p.categoria || null,
      }));
      const { error: qErr } = await supabaseAdmin.from("preguntas").insert(rows);
      if (qErr) throw qErr;
    }

    return NextResponse.json({ id: respuesta.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
