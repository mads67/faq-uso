import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { condicion, año_academico, medios, tramites, comentarios } = body;

    const { data: respuesta, error: respErr } = await supabaseAdmin
      .from("cuestionario_respuestas")
      .insert({ condicion, año_academico, medios, tramites })
      .select("id")
      .single();

    if (respErr) throw respErr;

    if (Array.isArray(comentarios) && comentarios.length > 0) {
      const rows = comentarios.map((c: { numero: number; comentario: string }) => ({
        respuesta_id: respuesta.id,
        numero: c.numero,
        comentario: c.comentario,
      }));
      const { error: cErr } = await supabaseAdmin.from("cuestionario_comentarios").insert(rows);
      if (cErr) throw cErr;
    }

    return NextResponse.json({ id: respuesta.id });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message :
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "Error interno";
    console.error("[cuestionario]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
