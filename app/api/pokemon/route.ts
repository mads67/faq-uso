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
    const { condicion, medios, tramites, comentarios, pokemonId, pokemonName, trainerName } = body;

    const { data: respuesta, error: respErr } = await supabaseAdmin
      .from("cuestionario_respuestas")
      .insert({
        condicion,
        medios,
        tramites,
        pokemon_id: pokemonId ?? null,
        pokemon_name: pokemonName ?? null,
        trainer_name: trainerName?.trim() || null,
      })
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
    console.error("[pokemon]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
